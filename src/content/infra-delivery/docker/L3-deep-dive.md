---
title: "L3 — Watching cache hits happen for real, and modeling the invalidation rule in code"
---

## A real build, twice, showing the cache in action

Captured terminal output, real Docker behavior — first build (cold cache):

```
$ docker build -t myapp .
[+] Building 24.3s
 => [1/5] FROM node:20.11-bookworm-slim                    2.1s
 => [2/5] WORKDIR /app                                      0.1s
 => [3/5] COPY package.json package-lock.json ./             0.1s
 => [4/5] RUN npm ci                                        19.8s
 => [5/5] COPY . .                                            0.2s
 => exporting to image                                       1.8s
```

Second build, after editing only `server.js` (source, not dependencies):

```
$ docker build -t myapp .
[+] Building 0.6s
 => [1/5] FROM node:20.11-bookworm-slim                    CACHED
 => [2/5] WORKDIR /app                                      CACHED
 => [3/5] COPY package.json package-lock.json ./             CACHED
 => [4/5] RUN npm ci                                        CACHED
 => [5/5] COPY . .                                            0.3s
 => exporting to image                                       0.3s
```

The 19.8-second `npm ci` step — the expensive one — shows `CACHED` and takes effectively zero time, because nothing that layer's cache key depends on (the base image, the working directory, `package.json`/`package-lock.json`'s content) changed. Only layer 5 (`COPY . .`, which depends on the entire source tree's content) reruns, because `server.js` is part of that tree. This 24.3s → 0.6s difference, on every single rebuild during active development, is the entire practical payoff of layer ordering — not a theoretical concern, a directly measured one.

Third build, after editing `package.json` (adding a dependency):

```
$ docker build -t myapp .
[+] Building 21.4s
 => [1/5] FROM node:20.11-bookworm-slim                    CACHED
 => [2/5] WORKDIR /app                                      CACHED
 => [3/5] COPY package.json package-lock.json ./             0.1s
 => [4/5] RUN npm ci                                        19.9s
 => [5/5] COPY . .                                            0.2s
```

Layer 3's cache key changed (the file content it copies changed), which cascades to layer 4 (`npm ci` reruns, since its own cache key includes layer 3's output) and layer 5 — exactly the cascade described in L2, now observed as real build output rather than asserted.

## Modeling the cache-invalidation rule in code

The rule underneath all three builds above is directly expressible as a pure function: a layer rebuilds if and only if its own inputs changed, or an earlier layer it depends on rebuilt — invalidation cascades forward, never backward.

```js
// layer-cache.mjs — models Docker's layer cache invalidation rule
function computeRebuildPlan(layers, changedInputs) {
  // layers: [{ name, inputs: string[] }, ...] in Dockerfile order
  // changedInputs: Set of input names that changed since the last build
  const rebuilds = [];
  let cascading = false;

  for (const layer of layers) {
    const inputsChanged = layer.inputs.some((i) => changedInputs.has(i));
    if (inputsChanged || cascading) {
      rebuilds.push(layer.name);
      cascading = true; // once one layer rebuilds, every layer after it must too
    }
  }
  return rebuilds;
}

const layers = [
  { name: "FROM node:20.11", inputs: ["base-image-tag"] },
  { name: "WORKDIR /app", inputs: [] },
  {
    name: "COPY package.json ./",
    inputs: ["package.json", "package-lock.json"],
  },
  { name: "RUN npm ci", inputs: [] }, // depends only on the previous layer's output
  { name: "COPY . .", inputs: ["source-tree"] },
];

console.log(computeRebuildPlan(layers, new Set(["source-tree"])));
// ["COPY . ."] — matches the second real build above

console.log(computeRebuildPlan(layers, new Set(["package.json"])));
// ["COPY package.json ./", "RUN npm ci", "COPY . ."] — matches the third build's cascade
```

## Failure modes

- **Putting `COPY . .` before installing dependencies.** The single most common Dockerfile performance mistake — it makes every layer after it (including the expensive install step) invalidate on _any_ source change, defeating caching almost entirely, even though the dependency manifest didn't change.
- **Using `latest` as a tag and assuming it's stable.** `latest` is just a tag like any other — it can be repointed to a different image at any time, meaning "pull `myapp:latest`" doesn't guarantee the same bytes twice, undermining the exact build-once-run-everywhere guarantee this unit is about. A specific version tag (or better, a content digest) is what actually pins it.
- **Copying more than necessary into the build context.** Without a `.dockerignore`, `COPY . .` includes `node_modules/`, `.git/`, and other large or irrelevant directories in the build context sent to the Docker daemon — this slows every build (the whole context has to be sent and hashed) and can bloat layer 5's cache key with files that have nothing to do with the actual application.
- **Forgetting that multi-stage build stages don't share state except through explicit `COPY --from`.** A variable set, a file written, or a package installed in stage 1 does not exist in stage 2 unless it's named in a `COPY --from=<stage>` — treating stages as if they share an environment (the way a single-stage Dockerfile's instructions do) produces confusing "why isn't this here" failures in the final image.
