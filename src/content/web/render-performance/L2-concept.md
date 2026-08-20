---
title: "L2 — Why position-based diffing rewrites everything, and what reflow/repaint actually cost"
---

## Why comparing by position turns one deletion into thousands of changes

**If contact #2500 is deleted from a list of 5,000, and every other
contact is unchanged, why would the framework think contact #2501
also changed?** Because without a stable identity to match against,
the only thing left to compare is _position_ — and once one item is
removed, every item after it shifts into a different position:

```mermaid
flowchart TD
    A["Old list, position 2500:\ncontact id 2500"] --> C{"Compare by position"}
    B["New list, position 2500:\ncontact id 2501\n(shifted up one slot)"] --> C
    C --> D["Framework sees:\n'the item at position 2500 changed'"]
    D --> E["Same conclusion repeats\nfor every position after 2500"]
```

At position 2500, the old list had contact 2500 and the new list has
contact 2501 — from a purely positional view, that _looks_ like the
content at that slot changed, even though contact 2501 didn't change
at all; it just moved. This repeats for every position from 2500 to
4999, producing thousands of "this changed" signals for a single
actual deletion.

**Would giving each row a stable key fix this, and how?** Yes — a key
lets the diffing algorithm ask "where did the item with id 2501 end
up?" instead of "did the item at this position change?" With keys,
deleting contact 2500 produces exactly one real change: remove the
row with key 2500. Every other row is recognized as the same row it
already was, just possibly shifted, which most frameworks can handle
far more cheaply than recreating content.

## What actually costs time once the DOM changes

**If the diff is small, does that guarantee the visible update is
fast?** Usually, but the diff result still has to go through the
browser's actual rendering pipeline, and not every kind of DOM change
costs the same:

| Stage           | What happens                                                     | Triggered by                                                                |
| --------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Reflow (layout) | Browser recalculates the position and size of affected elements  | Adding/removing elements, changing dimensions, changing text content length |
| Repaint         | Browser redraws the pixels for elements whose appearance changed | Changing colors, visibility, or anything reflow already affected            |
| Composite       | Browser combines already-painted layers onto the screen          | Purely visual layer changes (transforms, opacity) that don't need re-layout |

**Is reflow always worse than repaint?** Generally yes for
performance purposes — reflow can cascade (recalculating one
element's layout can force recalculating its neighbors and ancestors
too), while a change that only needs a repaint or composite step
affects a more limited, predictable scope. This is why removing one
row from a 5,000-row list (an unavoidable reflow, but ideally scoped
to just that row) is much cheaper than an unkeyed diff that touches
thousands of rows' content, forcing reflow work across all of them.

## Failure modes at this level

- **Assuming the virtual DOM diff itself is the expensive part.**
  Computing the diff is usually fast — the actual cost is applying a
  larger-than-necessary set of real DOM changes and the reflow/repaint
  work that follows.
- **Using array index as a key.** This looks like a fix (every item
  technically has a "key" now) but doesn't solve the identity problem
  at all — the index-as-key still shifts along with position, so it's
  functionally the same as no key.
- **Only testing render performance with small lists.** Like this
  unit's Scenario, a diffing inefficiency can be invisible at 5 items
  and severe at 5,000 — the underlying algorithmic behavior doesn't
  change, only whether its cost is noticeable.
