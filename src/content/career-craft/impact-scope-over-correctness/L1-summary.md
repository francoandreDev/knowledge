---
title: "L1 — Why doesn't being technically right guarantee being seen as senior? (impact and scope over correctness)"
---

import Scenario from "../../../components/Scenario.astro";

<Scenario label="Two correct bug reports, two very different reviews">
  <Fragment slot="facts">
    <div class="not-prose flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
      <div class="flex items-center gap-1.5"><span>🐛</span> <strong>Priya</strong> — fixed an off-by-one bug in a debug-only logging path, used by 2 internal engineers</div>
      <div class="flex items-center gap-1.5"><span>💰</span> <strong>Sam</strong> — caught a billing bug that would have double-charged 3,100 customers ($60 each, $186,000 total) before it reached production</div>
      <div class="flex items-center gap-1.5"><span>📋</span> <strong>Review outcome</strong> — Sam's write-up anchors the promotion packet; Priya's fix barely comes up</div>
    </div>
  </Fragment>

**Priya and Sam each found and fixed a real bug this quarter. Both
diagnoses were completely correct — no dispute, no debate, clean
fixes, both merged without incident. Priya's manager barely mentions
her fix in the performance review. Sam's is the centerpiece of a
promotion case. Both engineers were right. Why did only one review
read as "senior"?**

Correctness was never the variable that differed between them — both
were unambiguously correct. What differed was **scope**: how many
people, systems, or dollars the bug would have touched if it hadn't
been caught, and how much judgment it took to see that before it
happened.

</Scenario>

## The shape of the problem

- "Being right" is a baseline expectation, not a differentiator —
  everyone whose code ships is expected to be technically correct
  most of the time. It answers "did you do the task correctly?" but
  says nothing about "did the task matter?"
- **Scope** is the size of the blast radius a piece of work touches:
  how many users, how much revenue, how many other systems or teams
  depend on the thing being right. A perfectly correct fix to a
  narrow, low-traffic problem has small scope. A fix (or a catch)
  that prevents a wide-reaching failure has large scope, independent
  of how technically hard the fix itself was.
- Seniority signals aren't measured by difficulty of the code — a
  one-line fix that prevents a $186,000 billing error reads as more
  senior than a beautifully engineered solution to a problem nobody
  was going to hit. What's being evaluated is judgment about **what
  problems are worth solving**, not just skill at solving them.

## Key terms

- **Correctness** — whether a diagnosis or fix is technically
  accurate. A necessary baseline, not something that by itself
  demonstrates seniority.
- **Scope** — how far the consequences of a piece of work reach:
  number of users affected, systems touched, revenue or risk
  involved, or how many other people's work depends on it.
- **Impact** — the realized (or prevented) consequence of the work —
  scope multiplied by how likely the bad outcome actually was to
  happen.
- **Blast radius** — a way of describing scope concretely: if this
  had gone wrong, what exactly would have broken, and how far would
  it have spread?

## What this unit covers

L2 works through why correctness and scope are genuinely independent
variables — you can be right about something tiny, or right about
something huge — and how to estimate scope before you've finished the
work, not just after. L3 walks a full, real performance-review
write-up for both Priya and Sam side by side, showing exactly what
language turns a correct fix into a senior-level accomplishment on
paper.
