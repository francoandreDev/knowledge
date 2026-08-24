---
title: "L2 — What actually separates framing from spin from lying"
---

## Three things that can look similar from the outside

**If two updates about the same project can read completely
differently, how do you tell whether the difference is legitimate
storytelling or something dishonest?** By checking two separate
questions, not one: is every stated fact true, and is every _material_
fact included?

| Approach    | Every stated fact true? | Every material fact included?        | What's actually happening                                                     |
| ----------- | ----------------------- | ------------------------------------ | ----------------------------------------------------------------------------- |
| **Framing** | Yes                     | Yes                                  | Choosing order and emphasis among facts that are all present                  |
| **Spin**    | Yes                     | **No** — material facts are left out | Creating a misleading overall impression by omission, not by false statements |
| **Lying**   | **No**                  | N/A                                  | Asserting something that isn't true                                           |

Framing and lying are easy to tell apart — one changes emphasis, the
other changes facts. Spin is the harder case, because every individual
sentence in a spun narrative can be checked and found true. The tell
isn't in any single sentence; it's in what's missing.

## What makes a fact "material"

**If leaving out details makes something spin, does that mean every
version has to include literally everything?** No — the test isn't
"everything," it's _materiality_: would a reasonable reader's
understanding of the outcome actually change if they learned this
fact? A project update can reasonably skip which specific IDE the
team used; it can't reasonably skip a production outage the project
caused. The first detail doesn't change how anyone should read the
outcome. The second one does.

A reasonable reader means a normal person trying to understand the
result fairly, not someone looking for excuses. Everyday examples:
"we finished late because the bus broke down" is material if timing is
being judged; "I used a blue pen" usually is not. "The event raised
$500" is material; "the poster font was Arial" usually is not. "No one
was hurt" is material after an accident; "the chairs were green" is
not.

## A self-check before sending a narrative out

```mermaid
flowchart TD
    A["Draft the update"] --> B{"Is every stated\nfact actually true?"}
    B -->|"No"| C["Stop — this is lying,\nnot framing"]
    B -->|"Yes"| D{"Is any material fact\nmissing entirely?"}
    D -->|"Yes"| E["This is spin —\nadd the missing context"]
    D -->|"No"| F["This is legitimate framing —\nemphasis and order are yours to choose"]
```

The two questions in this flowchart are independent checks, not a
single vague "does this feel honest" judgment call — which is what
makes the self-check actually usable in the moment, rather than
something that only becomes obvious in hindsight.

In simpler checklist form: did I say anything false? Did I leave out
anything that would change the reader's judgment? Did I give serious
facts enough space for their seriousness?

## Why framing is worth doing deliberately, not avoiding

**If spin and lying are both risks nearby, is the safest move to avoid
shaping the narrative at all — just report facts in whatever order
they happened?** No — chronological order isn't neutral either; it
just means someone else's instinctive reaction becomes the default
framing instead of a deliberate one. If a win and a setback both
happened, _not_ choosing how to present them doesn't avoid framing —
it just means the reader's own assumptions (often "no news is good
news," or the opposite) fill the gap left by an undeliberate telling.
Owning the narrative honestly is the alternative to that default, not
a departure from honesty.

Chronological order is just one frame: "first we failed, then we
fixed it" feels different from "we delivered the result, after a
failure we fixed." Both can be honest if both include the same
material facts.
