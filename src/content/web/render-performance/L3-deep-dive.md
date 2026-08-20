---
title: "L3 — Measuring the diff-op gap between unkeyed and keyed lists"
---

## Building a real diff function to measure the Scenario's bug directly

**Here's a simplified unkeyed diff — comparing old and new lists
position by position, the way the Scenario's bug behaves. What does
it actually produce for a single deletion?**

```js
function diffUnkeyed(oldList, newList) {
  const ops = [];
  const maxLen = Math.max(oldList.length, newList.length);
  for (let i = 0; i < maxLen; i++) {
    const oldItem = oldList[i];
    const newItem = newList[i];
    if (oldItem === undefined && newItem !== undefined) {
      ops.push({ type: "create", index: i, id: newItem.id });
    } else if (oldItem !== undefined && newItem === undefined) {
      ops.push({ type: "remove", index: i, id: oldItem.id });
    } else if (oldItem.id !== newItem.id) {
      ops.push({
        type: "update",
        index: i,
        fromId: oldItem.id,
        toId: newItem.id,
      });
    }
  }
  return ops;
}
```

```js
const oldList = makeContacts(5000);
const newList = oldList.filter((c) => c.id !== 2500); // delete one, from the middle

diffUnkeyed(oldList, newList).length; // 2501
```

Deleting contact 2500 shifts every subsequent contact one position
earlier. From position 2500 onward, the item that used to be at each
position no longer matches the item now there — the diff records an
`"update"` at every one of those 2,499 positions, plus one final
`"remove"` for the last slot that has nothing left to compare against.
**2,501 operations for a single logical deletion.**

## The fix: diff by identity, not position

**What changes if the diff matches items by id instead of position?**

```js
function diffKeyed(oldList, newList) {
  const ops = [];
  const oldById = new Map(oldList.map((item) => [item.id, item]));
  const newIds = new Set(newList.map((item) => item.id));
  for (const oldItem of oldList) {
    if (!newIds.has(oldItem.id)) {
      ops.push({ type: "remove", id: oldItem.id });
    }
  }
  for (const newItem of newList) {
    if (!oldById.has(newItem.id)) {
      ops.push({ type: "create", id: newItem.id });
    }
  }
  return ops;
}
```

```js
diffKeyed(oldList, newList).length; // 1
```

Instead of asking "does the item at this position match," this asks
two direct questions: "which ids from the old list are missing in the
new list?" (removed) and "which ids in the new list weren't in the
old list?" (created). Every id that appears in both lists — 4,999 of
them — is simply left alone, because it's recognized as the same
item regardless of where it now sits. The result is exactly one
operation: remove the item with id 2500. **Same logical change,
2,501 operations versus 1.**

## Why this matters more as the list grows

**Does the gap between unkeyed and keyed diffing stay constant as the
list size changes?** No — for a single deletion from the middle, the
unkeyed diff cost scales with _how many items sit after the deleted
one_, while the keyed diff cost stays fixed at 1 no matter how large
the list is:

```js
diffUnkeyed(
  makeContacts(50).filter((c) => c.id !== 25),
  makeContacts(50),
).length; // scales with list size
diffKeyed(
  makeContacts(50000),
  makeContacts(50000).filter((c) => c.id !== 25000),
).length; // always 1
```

At 50 items, the unkeyed cost (roughly 25 operations) might not even
be noticeable. At 5,000 or 50,000 items, that same _pattern_ produces
thousands to tens of thousands of operations — each one potentially
triggering its own share of reflow work — which is exactly why this
unit's Scenario feels fine in a small dev list and visibly stutters
in production.

## What generalizes and what doesn't

The core lesson — diffing by position conflates "this position's
content changed" with "this item moved," while diffing by identity
keeps those separate — generalizes to any UI framework's list
rendering, not just this simplified example: React, Vue, and similar
frameworks all expose a `key` prop precisely to let the diffing
algorithm match by identity instead of position. What's specific to
this worked example: the exact op counts (2,501 vs. 1) are particular
to deleting one item from the middle of a 5,000-item list — a
different kind of change (reordering the whole list, or updating
every item's content) has a different unkeyed-vs-keyed gap, not
necessarily this same dramatic ratio. **Try extending it yourself:**
if instead of deleting one contact, the entire list were reversed
(same 5,000 ids, just in the opposite order), this unit's simplified
`diffKeyed` actually reports **zero** operations — every id still
exists in both lists, so nothing looks created or removed. That's not
actually correct: the rows genuinely need to move on screen. What
does this reveal about the difference between "detecting that an
item's identity is unchanged" and "detecting that an item's position
changed"? What would `diffKeyed` need to also track to handle
reordering correctly, not just additions and removals?

## Failure modes

| Failure mode                                                  | What it gets wrong                                                                                                                                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Using the array index as the key                              | The index shifts along with position exactly like no key at all — it doesn't restore identity-based matching, just adds a misleading key prop                                        |
| Assuming a small diff result guarantees a fast visible update | The diff being small is necessary but not sufficient — the actual DOM operations it produces still have to go through reflow/repaint, so unnecessary operations still cost real time |
| Only testing list updates with small, dev-sized data          | An unkeyed diffing inefficiency can be completely invisible at 5–50 items and severe at thousands — this unit's Scenario is exactly that gap                                         |
| Treating every reflow-triggering change as equally expensive  | A reflow scoped to one row is much cheaper than a reflow cascading across thousands of rows — the _scope_ of what changed matters as much as whether reflow happens at all           |
