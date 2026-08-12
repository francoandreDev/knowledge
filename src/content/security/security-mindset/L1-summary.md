---
title: 'L1 — Why doesn''t "it works" mean "it''s safe"?'
---

- Correctness testing asks "does this do what it's supposed to do for the inputs I expect?" Security asks a fundamentally different question: "what can this do if someone deliberately sends inputs I _didn't_ expect, with intent to misuse it?"
- The **security mindset** is thinking like an adversary, not a user — actively asking "how would I break this" instead of just "does this work" — and it doesn't come naturally, because normal engineering practice optimizes for the happy path.
- **Threat modeling** is the structured version of that question: for a given system, who might attack it, what would they want, and what's the easiest path to get it? It's done _before_ something breaks, not after.
- A simple, durable framework: **STRIDE** — Spoofing (pretending to be someone else), Tampering (altering data/code), Repudiation (denying an action happened), Information disclosure (leaking data), Denial of service (making it unavailable), Elevation of privilege (gaining access you shouldn't have). Each is a different _category_ of "what could go wrong," not a specific bug.
- **Trust boundaries** matter more than any single line of code: the moment data crosses from something you don't control (user input, a third-party API, a file upload) into something you do, every assumption about that data has to be re-earned, not inherited.
- Security is not a feature you add at the end — a system "working" only tells you the intended paths function; it says nothing about the paths nobody intended, which is exactly where attackers operate.
- The goal of this unit isn't to memorize specific vulnerabilities (that's `owasp-top-10` and later units) — it's building the reflex to ask "what's the worst thing an adversary could do here" as a normal part of reviewing any design, not a separate pass done by someone else.
