---
title: "L2 — Bounded contexts, explicit translation, and modeling rules instead of fields"
---

## Why can't there just be one correct definition of "Customer"?

**If Billing and Support disagree about what "Customer" means, isn't the
fix just to pick whichever definition is more correct and make everyone
use it?**

```mermaid
flowchart TD
    A["Force one shared definition\n(pick Billing's meaning)"] --> B["Support's reports now silently\nundercount — 1 'Customer' per\ncompany, not per ticket submitter"]
    C["Recognize two separate concepts"] --> D["Billing context: BillingAccount"]
    C --> E["Support context: SupportContact"]
    D --> F["Explicit link: which SupportContacts\nbelong to which BillingAccount"]
    E --> F
```

Forcing one definition doesn't resolve the disagreement — it just makes
one team's model silently wrong for the other team's actual questions.
Support genuinely needs to count individual ticket submitters; collapsing
that into "one Customer per paying account" doesn't simplify anything, it
deletes information Support actually needs. The two concepts aren't in
conflict — they're both real, and both deserve their own name.

## Bounded contexts: where a term's meaning holds

**If both definitions are legitimate, how do they coexist in the same
system without colliding?** A **bounded context** is an explicit boundary
— usually matching how the business itself is organized (a team, a
subsystem, a business process) — inside which a term has one precise,
agreed meaning. Outside that boundary, the same word may mean something
else entirely, and that's expected, not a bug:

For example, Billing may be a team, "invoices" may be a subsystem, and
"collecting payment" may be a business process. The shared idea is: this
is the area where one meaning is true.

```text
Billing context:
  "Customer" = BillingAccount (the thing/account that owns invoices)

Support context:
  "Customer" = SupportContact (the person who opened the ticket)

Explicit relationship at the boundary:
  Each SupportContact belongs to exactly one BillingAccount
  (a company's employees all link to their employer's billing account)
```

The critical piece isn't just naming things differently — it's the
**explicit relationship at the boundary**. Without it, the two contexts
just silently disagree with no way to reconcile a cross-team report. With
it, a report combining both can correctly say "4,800 support contacts
across 1,200 billing accounts" instead of two contradictory "customer
counts."

## Modeling rules, not just fields

**Does "modeling the domain" just mean picking better names for database
columns?** Not quite — it means capturing the actual rules the business
operates by, as concepts the code enforces, not just data it stores.

The names in backticks below are examples of names that might exist in
code. The important part is not the syntax; it is that the name carries a
business rule instead of being a loose storage box.

| Just storing data                         | Modeling the domain                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------------------ |
| A `status` column that accepts any string | A `SubscriptionStatus` that can only move active → grace-period → cancelled, in that order |
| A `discount_percent` field with no bounds | A `Discount` concept that enforces "never exceeds 40% without manager approval"            |
| A `customer_type` flag                    | Separate `BillingAccount` and `SupportContact` concepts, each with their own real behavior |

The right-hand column isn't more code for its own sake — each of those
constraints is an actual rule a domain expert would state out loud
("a subscription can't jump straight from active to cancelled without
the grace period"). A model that doesn't enforce it lets code elsewhere
silently violate a rule the business actually depends on.

## The generalizable lesson

**Is the takeaway "always split every ambiguous word into two concepts"?**
Not automatically — splitting has a real cost (more concepts to maintain,
an explicit relationship to keep in sync). The actual skill is noticing
_when_ a shared word is masking two genuinely different concepts with
different rules and different questions asked of them — as opposed to a
single concept that's simply described two ways — and only introducing a
boundary where the underlying meanings have actually diverged.

That is how the code stops fighting the business: it stops forcing
everyone to use one word with a false or incomplete meaning.
