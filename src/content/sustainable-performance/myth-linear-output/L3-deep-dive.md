---
title: "L3 — A worked crunch scenario with real numbers, and the historical evidence behind the curve"
---

## The historical evidence: this isn't just an engineering anecdote

One of the most frequently cited data sources for this exact question comes from detailed factory output records from WWI-era munitions plants, analyzed decades later by economist John Pencavel. The pattern found: weekly output climbed with hours worked up to roughly the high-40s/low-50s range, then flattened — and for weeks where hours were pushed well past 60, total weekly output was measurably **lower** than weeks with fewer hours worked, not just proportionally less productive per hour. This is the same diminishing-then-negative shape from L2's chart, observed in a domain (physical factory output) with none of the "maybe it's just a knowledge-work thing" ambiguity — the mechanism (fatigue degrading output faster than added time compensates for) shows up even in comparatively simple, repetitive manual labor.

## A worked crunch scenario: the actual arithmetic

A team facing a deadline considers pushing from a normal 40-hour week to a sustained 65-hour week for four weeks, reasoning "that's 62% more hours, so we should get roughly 62% more done."

**What a linear model predicts:** if 40 hours produces 40 "units" of net output per week (using round numbers for legibility), 65 hours should produce 65 units — a 25-unit weekly gain, 100 units over four weeks.

**What actually happens, modeling fatigue-driven rework explicitly:**

- Weeks 1: focus holds up reasonably well early in a crunch. 65 hours produces close to the linear prediction — say 58 units (some early fatigue cost, but modest).
- Week 2: accumulated fatigue starts raising the error rate. Raw hours still produce more _attempted_ work, but a rising share requires rework the following days. Net output: 50 units.
- Week 3: rework from week 2's mistakes consumes real hours this week, on top of new fatigue-driven mistakes compounding further. Net output: 38 units.
- Week 4: the team is now spending a meaningful fraction of each day fixing problems introduced in weeks 2–3, on top of new ones. Net output: 25 units — **less than the original 40-hour week would have produced**.

**Four-week total: 58 + 50 + 38 + 25 = 171 units**, against a 40-hour-baseline four-week total of 160 units (40 × 4) — only marginally ahead of just working normal weeks the whole time, despite averaging 62% more hours across the month, and with the team now fatigued heading into whatever comes next. The naive linear prediction (260 units: 65 × 4) overstates the real outcome by roughly 50%, because it has no term for compounding rework cost at all.

This is an illustrative model, not a universal formula — the specific numbers depend on the type of work and the team — but the _shape_ (a real early gain, shrinking week over week, eventually going net-negative) matches both the historical factory data and the mechanism described in L2: fatigue-driven errors aren't paid for by the hour that caused them, they're paid for by every hour afterward spent finding and fixing them.

## Failure modes

- **Measuring only raw hours or raw output, never net output.** A crunch week's raw lines-of-code or raw hours-logged can look impressive while net _shippable, correct_ output is actually falling — the trap is that the visible, easy-to-measure numbers (hours, activity) keep climbing even in the negative-returns region, while the number that actually matters (net usable output) is quietly falling behind them.
- **Judging a single all-nighter by the same curve as a sustained pattern.** A short, one-time push before a genuinely hard, immovable deadline operates on a much shorter fatigue-accumulation timescale than a sustained 65-hour month — treating every instance of extra hours as equally risky, or equally fine, ignores that the curve's steepness depends heavily on duration, not just intensity.
- **Assuming the fix is "work fewer hours" in isolation, without addressing why the crunch was called.** This unit's argument is about the shape of the output curve, not a claim that deadlines or urgency are never real — the actionable takeaway is usually about scope, sequencing, or staffing (what's cut, deferred, or added), not simply "stop pushing" with no alternative plan for the actual deadline pressure.
- **Applying a factory-labor finding to knowledge work without checking it still holds.** The historical data is compelling evidence that the shape is real and not just a modern "knowledge work is special" claim, but the exact bend points differ — deep, judgment-heavy, error-consequential technical work plausibly bends earlier than the routine manual labor in the original data, not later; using the factory numbers as if they were precise engineering benchmarks would be over-claiming what that evidence supports.
