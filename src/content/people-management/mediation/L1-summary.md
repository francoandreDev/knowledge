---
title: "L1 — How do I handle conflict between two people on my team? (mediation, staying neutral, addressing root cause)"
---

import Scenario from "../../../components/Scenario.astro";

<Scenario label="Two engineers, six weeks of tense code reviews, and a manager who tried the easy fix first">
  <Fragment slot="facts">
    <div class="not-prose flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
      <div class="flex items-center gap-1.5"><span>💥</span> <strong>Surface conflict</strong> — Priya and Devon keep clashing in code review comments, visible to the whole team</div>
      <div class="flex items-center gap-1.5"><span>🩹</span> <strong>First attempt</strong> — manager says "please be more respectful of each other's time" in a shared Slack message</div>
      <div class="flex items-center gap-1.5"><span>🔁</span> <strong>Result</strong> — the tone softens for a week, then the same pattern comes back</div>
    </div>
  </Fragment>

**Priya and Devon, two senior engineers on the same team, have been
clashing in code review for six weeks — terse comments, re-requested
changes, visible tension in team meetings. Their manager sends a
message asking both to "be more respectful of each other's time." It
works for about a week. Then the same pattern returns, worse. What
did the message miss, and why does it keep coming back?**

The message addressed the _symptom_ — terse comments — without ever
finding out _why_ two experienced engineers, neither of whom is
generally difficult to work with, keep colliding specifically with
each other. A conflict that keeps recurring after a surface-level fix
is usually a sign the actual disagreement was never identified.

</Scenario>

## The shape of the problem

- When two people on a team are in conflict, the visible behavior
  (terse comments, avoided meetings, passive-aggressive messages) is
  rarely the actual disagreement — it's a symptom of something
  underneath that hasn't been named.
- A manager's instinct is often to jump straight to a fix: "just be
  nicer," "here's the style guide, follow it," "let's compromise on X."
  This can quiet things temporarily, but if it doesn't address why the
  conflict exists, it comes back — often worse, because both people
  now also feel unheard.
- **Mediation** means helping two people work through a conflict
  without the mediator picking a side or handing down a solution.
  The mediator's job isn't to decide who's right — it's to help both
  people find and address the real disagreement themselves.

## Key terms

- **Position** — what someone says they want ("I want you to stop
  requesting so many small changes in my PRs").
- **Interest** — the underlying reason behind that position ("I feel
  like my design decisions aren't trusted, so every comment reads as
  a challenge to my competence"). Positions are what people argue
  about; interests are usually what the conflict is actually about.
- **Neutrality** — the mediator doesn't take either side's position,
  doesn't assign blame, and doesn't propose the solution — the
  mediator's role is to structure a conversation that lets both
  parties surface their actual interests and find a resolution
  together.
- **Root cause** — the underlying interest or unmet need driving the
  conflict, as opposed to the specific incidents (a terse comment, a
  missed meeting) that are merely where the conflict becomes visible.

## What this unit covers

L2 works through why addressing the surface symptom instead of the
root cause guarantees recurrence, and what a manager actually does
differently when acting as a neutral mediator instead of a referee
handing down a verdict. L3 walks a full mediation with Priya and
Devon from the opening scenario — separate conversations to surface
each person's real interest, then a structured joint conversation
that finds and resolves the actual disagreement underneath the code
review friction.
