---
title: "L2 — Telling true duplication from coincidental duplication"
---

## The test that actually matters: do they change for the same reason?

**If two pieces of code look identical, isn't that already proof they
should be merged into one?** Not by itself — the real question DRY is
asking isn't "do these look the same," it's "do these represent the
same underlying rule, such that a change to that rule should always
apply to both places at once." Two functions can be byte-for-byte
identical today and still be **coincidental duplication** if they exist
for unrelated reasons — a tax calculation and a discount calculation
that both happen to multiply by a percentage and round to two decimals
aren't the same rule wearing the same shape; they're two different
rules that happen to look alike right now.

```mermaid
flowchart TD
    Dup["Two pieces of code look similar"] --> Q{"Would a change to the\nunderlying rule need to\nhit both places, always?"}
    Q -->|yes| True["True duplication\n→ extract a shared abstraction"]
    Q -->|no, or unsure| Coincidental["Coincidental duplication\n→ leave separate for now"]
```

**Why does merging coincidental duplication cause a problem, if the
code was identical anyway?** Because "identical today" doesn't mean
"stays identical" — the moment one of the two rules needs to change and
the other doesn't, the shared function has to grow a branch, a flag, or
a parameter just to keep serving both callers. The abstraction didn't
prevent a second change; it just moved the second change _inside_ the
shared function instead of into a second, separate function — often
making that change harder, not easier, because now it has to avoid
breaking the first caller too.

## The rule of three

**So when is it actually safe to extract a shared function?** A common,
practical heuristic: tolerate duplication the first two times it
appears, and only extract a shared abstraction on the third occurrence
— by then there's real evidence of a pattern, not just a guess. Two
occurrences alone aren't enough evidence to know whether it's true or
coincidental duplication; a third occurrence, especially one that
reveals what actually varies between them, is what makes the shape of
the real abstraction visible.

| Occurrences | What to do                               | Why                                                                   |
| ----------- | ---------------------------------------- | --------------------------------------------------------------------- |
| 1           | Nothing — there's nothing to compare yet | A single instance can't be "duplicated"                               |
| 2           | Usually leave it, but take note          | Not enough evidence to know if it's the same rule or a coincidence    |
| 3+          | Extract, once the shared shape is clear  | Enough real instances to see what's actually constant vs. what varies |

## What a forced abstraction looks like

**What's the concrete warning sign that an abstraction was extracted
too early?** A parameter — often a boolean flag — that exists purely to
let the shared function branch internally between two callers that
don't actually share a rule. `calculateDiscount(price, qty, isBulk)`
branching on `isBulk` isn't one rule with a variation; it's two rules
stitched together with an `if`, and every future caller has to
understand both branches to safely use either one. This is the concrete
shape L3 works through in full — not just described, but built,
broken, and fixed.

## The generalizable lesson

**Does DRY mean "never write similar-looking code twice"?** No — DRY is
about knowledge, not text. Two pieces of code can look completely
different and still violate DRY if they encode the same business rule
in two places (a discount cap defined as `100` in one file and `1.0` as
a fraction in another, both meant to represent "never discount more
than the full price"). Conversely, two pieces of code can look
identical and not violate DRY at all, if they represent genuinely
separate rules that happen to coincide today. The judgment call is
always about the underlying knowledge, not the surface-level text.
