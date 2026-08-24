---
title: "L2 — Why query count explains the slowdown, and what normalization actually trades off"
---

## Why "the database is slow" is the wrong diagnosis

**If the schema and the code didn't change, and the database itself
is healthy, what actually scales with the number of orders?** The
_number of queries issued per request_ — not the database's raw
speed. One query per order, on top of the original query for the
list, means the total query count grows in direct proportion to how
many orders exist:

```mermaid
flowchart LR
    A["1 query:\nfetch all orders"] --> B["For each order..."]
    B --> C["1 query:\nfetch its customer"]
    C --> D["Repeat N times"]
    D --> E["Total: N + 1 queries"]
```

At 20 orders, that's 21 queries — each one fast individually, so the
total delay is barely noticeable. At 50,000 orders, that's 50,001
queries — and even if each one is still individually fast, the fixed
overhead of _making_ a query (network round-trip, connection
handling) multiplied by 50,001 is what actually produces the
multi-second delay. The database was never "slow" in isolation; the
code was asking it to do 50,001 separate small things instead of one
larger one.

**Would a faster database server fix this on its own?** Only
partially — it would reduce the cost of each individual query, but
the total delay still scales linearly with the number of orders
either way. The structural problem (query count proportional to list
size) doesn't go away just because each query gets a little cheaper.

## What normalization and denormalization actually trade off

**If normalization avoids duplicating a customer's name across every
one of their orders, why would anyone choose to duplicate it
anyway?** Because normalization and denormalization optimize for
different things, and the right choice depends on the actual access
pattern:

Here is the same customer in two shapes:

| Shape        | Example picture                                                               |
| ------------ | ----------------------------------------------------------------------------- |
| Normalized   | `orders` stores `customerId: 7`; `customers` stores `id: 7, name: "Ava"` once |
| Denormalized | every order row also stores `customerName: "Ava"` directly                    |

Normalization does not automatically create N+1. A normalized design
can still be read efficiently with one join. The N+1 bug appears when
the app reassembles related data by asking the database one small
question per row instead of asking one joined question.

| Approach     | What it optimizes for                                                                       | What it costs                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Normalized   | Writes stay simple — a customer's name is updated in exactly one place                      | Reads that need related data require a join or an extra lookup per item                             |
| Denormalized | Reads are fast — the customer's name is already sitting on the order record, no join needed | Writes get more complex — renaming a customer means updating every order that duplicated their name |

**Is one of these approaches simply better than the other?** No —
each is the right answer for a different access pattern. A system
that reads order-with-customer-name constantly but renames customers
almost never benefits from denormalizing that one field; a system
that updates customer records frequently and rarely needs the name on
the order directly is better off staying normalized and paying the
join cost on the rare read.

## Failure modes at this level

- **Treating "add an index" as the fix for every slow query.** An
  index helps a single query find data faster — it does nothing about
  a query _pattern_ that issues N+1 separate queries in the first
  place. If the problem is "50,001 round trips," indexing may make
  each trip cheaper, but it does not turn 50,001 trips into one.
- **Denormalizing data without a plan for keeping duplicates in
  sync.** Duplicating a customer's name onto every order is only safe
  if there's a clear, enforced process for updating every copy when
  the original changes — otherwise the duplicates quietly drift out
  of sync.
- **Only testing with small data sets.** A query pattern's real cost
  is often invisible at the data volumes present in development —
  this unit's Scenario is exactly that: 20 orders hides a problem that
  50,000 orders exposes.
- **Forgetting the planner exists.** A single SQL query can still be
  slow if the database chooses, or is forced into, an expensive plan:
  scan too much data, sort too many rows, use the wrong join order, or
  miss an index that would have narrowed the work.
