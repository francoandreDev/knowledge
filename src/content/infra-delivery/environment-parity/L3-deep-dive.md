---
title: "L3 — A real drift bug, and the minimal Dockerfile that eliminates its class"
---

## A real drift bug: implicit timezone dependence

This function looks correct and passes locally, because "locally" happens to share a timezone assumption with the test author:

```js
// report.mjs — computes "is this timestamp today?" using local time
function isToday(timestampMs) {
  const now = new Date();
  const then = new Date(timestampMs);
  return (
    now.getFullYear() === then.getFullYear() &&
    now.getMonth() === then.getMonth() &&
    now.getDate() === then.getDate()
  );
}

// On a laptop set to America/New_York, at 11pm local time:
console.log(isToday(Date.now())); // true — correct, "now" is today

// The exact same code, same input, on a CI runner set to UTC
// (11pm New_York == 3-4am UTC the *next* day):
console.log(isToday(Date.now())); // false — the "bug" that "only happens in CI"
```

Nothing about the code changed between the two runs — `getFullYear`/`getMonth`/`getDate` all read the **system's local timezone**, which the laptop and the CI runner disagree on. This is textbook environment drift: an ambient setting (`TZ`), not a code path, determines the outcome, and no amount of staring at `isToday`'s logic finds the bug — it's not in the logic.

```js
// report-fixed.mjs — pins the comparison to an explicit, injected timezone
// instead of relying on whatever the host environment happens to be set to
function isToday(timestampMs, timezone, referenceNowMs = Date.now()) {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: timezone }); // en-CA => YYYY-MM-DD
  return fmt.format(referenceNowMs) === fmt.format(timestampMs);
}
```

The fix isn't "set `TZ=UTC` everywhere and hope" (that's still an ambient, easy-to-forget setting) — it's removing the function's dependence on ambient environment state entirely by making the timezone an explicit parameter. This is the same principle containers apply at the infrastructure level, applied to a single function: don't let correctness depend on something outside the artifact itself.

## A minimal real Dockerfile

This is a genuinely runnable, minimal image definition for a small Node service — small enough to read end to end, but every line is doing real work, not filler:

```dockerfile
# Pin the exact base image by digest-eligible tag, not a moving "latest"
FROM node:20.11-bookworm-slim

WORKDIR /app

# Copy dependency manifests first, install, THEN copy source — this
# layer-ordering means `npm ci` only reruns when dependencies actually
# change, not on every source edit, and it's not optional for parity:
# npm ci (unlike npm install) refuses to proceed if package-lock.json
# doesn't exactly match package.json, guaranteeing the exact dependency
# tree that was locked, not "whatever resolves today."
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
```

Building this (`docker build -t my-service .`) produces one immutable image. Running it (`docker run -p 3000:3000 my-service`) on a laptop, in CI, or on a production host executes the _exact same bytes_ — same Node binary, same OS libraries, same `node_modules` tree — every time. The only thing that can differ between environments now is what's explicitly passed in at `docker run` time (environment variables, mounted volumes), which is deliberate configuration, not accidental drift.

## Failure modes

- **Pinning the base image tag but not the digest, and treating "pinned" as "immutable."** `node:20.11-bookworm-slim` is far more specific than `node:latest`, but a tag can still technically be repointed (rare, but possible for a registry maintainer to push a new image under the same tag) — production-grade pipelines pin by content digest (`node:20.11-bookworm-slim@sha256:...`) when true byte-for-byte reproducibility matters, not just version-number stability.
- **Letting `npm install` run instead of `npm ci` in the image build.** `npm install` will happily resolve slightly different transitive dependency versions if the lockfile and registry state have drifted since the lockfile was written; `npm ci` refuses to do this and fails loudly instead — silently drifting dependency versions between builds defeats the entire point of a pinned build step.
- **Baking secrets or environment-specific config into the image.** The parity goal is "same artifact, different config injected per environment at run time" (via `docker run -e` or an orchestrator's config), not "one image per environment" — building a separate image per environment reintroduces exactly the drift risk containers exist to remove, just one layer up.
- **Assuming container parity extends to things outside the container.** A container guarantees parity for what's _inside_ it — the OS, runtime, and app dependencies. It says nothing about a database schema being out of sync, a downstream API behaving differently in staging vs. prod, or the host kernel/network configuration differing — parity has to be reasoned about at each layer, not assumed to propagate automatically just because one layer achieved it.
