---
title: 'L1 — Why does "it works on my machine" keep happening?'
---

- "Works on my machine" is a symptom of **environment drift**: your laptop, the CI runner, and production have quietly diverged in OS version, installed libraries, environment variables, or even just what else happens to be running — and the code depends on that context without declaring it.
- The dependency isn't always obvious in the code. It hides in: a system library version, a locale/timezone setting, a globally-installed tool version, a port that happens to be free on your machine, file paths that only exist on your OS.
- **Environment parity** means dev, CI, and production are running the _same_ environment — not "similar," not "same versions on paper" — down to the OS, the runtime, and the exact dependency versions, so a class of "worked here, broke there" bugs becomes structurally impossible rather than something you hope doesn't happen.
- **Containers** are the dominant modern answer: a container packages an application together with its entire runtime environment (OS libraries, language runtime, dependencies) into one artifact that runs identically wherever a container engine exists — the same container that ran on a laptop is, byte-for-byte, the same one that runs in production.
- This is different from a VM: a VM virtualizes an entire OS kernel per instance (heavy, minutes to boot); a container shares the host's kernel and only isolates the process/filesystem view (light, seconds to boot) — the isolation is weaker in theory but the parity guarantee is just as strong for "same dependencies, same behavior."
- The underlying engineering principle this unit is really about: **make the environment part of the versioned, reviewed artifact**, not tribal knowledge in someone's setup notes or a wiki page that goes stale the day after it's written.
