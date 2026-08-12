---
title: "L1 — How do we package an app so it runs the same everywhere?"
---

- An **image** is a built, immutable artifact — a stack of filesystem layers plus metadata (entrypoint, exposed ports, environment defaults). A **container** is a _running instance_ of an image — the same relationship as a class and an object, or a program file and a running process.
- Building an image (`docker build`) happens once per version; running it (`docker run`) can happen many times, on many machines, from the same unchanged image — this is the mechanical basis of the environment-parity guarantee covered in `infra-delivery/environment-parity`.
- **Images are built in layers**, one per Dockerfile instruction, and layers are cached and reused: if an early instruction's inputs haven't changed, Docker reuses the cached layer instead of re-executing it — this is why instruction _order_ in a Dockerfile has real, measurable performance consequences, not just stylistic ones.
- A **registry** (Docker Hub, a private registry) is where built images are stored and retrieved by name and tag (`node:20.11-bookworm-slim`) — pushing an image publishes it there; pulling retrieves it; this is what lets a CI pipeline build once and have production pull the exact same artifact, rather than rebuilding.
- **Multi-stage builds** let a Dockerfile use one stage to compile/build (with all the heavy build tooling) and a second, separate stage to produce the final runtime image containing only what's needed to run — the build tools never end up in the shipped image, which matters for both image size and attack surface.
- Containers share the host machine's kernel (unlike a VM, which virtualizes a whole OS) — this is why containers start in milliseconds-to-seconds instead of a VM's tens-of-seconds-to-minutes, at the cost of a narrower isolation boundary (covered as a trade-off, not a flaw, in `environment-parity`).
- This unit's practical goal: understand the image/container/layer/registry mechanics precisely enough to reason about _why_ a Dockerfile behaves the way it does — slow rebuilds, unexpectedly large images, cache misses — not just how to copy a working Dockerfile from somewhere else.
