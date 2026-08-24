---
title: "L3 — Simulating the Scenario's force-push, and how --force-with-lease catches it"
---

## Modeling commit history well enough to measure the actual loss

**A real git repository is more machinery than needed to see what
happened. Here's a minimal commit-history model — enough to measure
exactly which commits the Scenario's force-push destroys.**

Here is the story before code:

| Commit | Parent | Who made it                    | In old remote line? | In developer's new local line? |
| ------ | ------ | ------------------------------ | ------------------- | ------------------------------ |
| `A`    | none   | shared starting point          | Yes                 | Yes                            |
| `B`    | `A`    | earlier shared work            | Yes                 | Yes                            |
| `C`    | `B`    | last commit developer had seen | Yes                 | Yes                            |
| `D`    | `C`    | teammate's newer push          | Yes                 | No                             |
| `E`    | `C`    | developer's rebased work       | No                  | Yes                            |

In the JavaScript below, `null` means "no parent." A `Set` is used to
remember hashes without duplicates. `find` searches the array for the
commit with a matching hash. "Reachable" means the loop starts at a
tip like `D` or `E` and walks backward through `parent` links.

```js
function findCommit(history, hash) {
  return history.find((c) => c.hash === hash);
}

function reachableHashes(history, tipHash) {
  const hashes = new Set();
  let current = findCommit(history, tipHash);
  while (current) {
    hashes.add(current.hash);
    if (current.parent === null) break;
    current = findCommit(history, current.parent);
  }
  return hashes;
}

function commitsLostByForcePush(history, oldRemoteTip, newLocalTip) {
  const oldReachable = reachableHashes(history, oldRemoteTip);
  const newReachable = reachableHashes(history, newLocalTip);
  return [...oldReachable].filter((h) => !newReachable.has(h));
}
```

```js
const history = [
  { hash: "A", parent: null },
  { hash: "B", parent: "A" },
  { hash: "C", parent: "B" },
  { hash: "D", parent: "C" }, // teammate's commit, pushed after dev last fetched
  { hash: "E", parent: "C" }, // dev's rebased local work, based on a stale C
];

commitsLostByForcePush(history, "D", "E"); // ["D"]
```

The remote's actual tip is `D` (the teammate's commit). The
developer's local tip after rebasing is `E`, built on top of `C` —
because their local view never included `D` in the first place.
`commitsLostByForcePush` walks backward from both tips and finds
exactly one commit reachable from the old tip but not the new one:
`D` itself. This is the mechanical, measurable version of "the
teammate's commit disappeared" — not a metaphor, an actual reachability
calculation.

## Reproducing why a normal push would have caught this

**Before force was involved, would a normal `git push` have allowed
this?**

```js
function isAncestor(history, ancestorHash, tipHash) {
  let current = findCommit(history, tipHash);
  while (current) {
    if (current.hash === ancestorHash) return true;
    if (current.parent === null) return false;
    current = findCommit(history, current.parent);
  }
  return false;
}
```

```js
isAncestor(history, "D", "E"); // false
```

A normal push checks exactly this: is the remote's current tip (`D`)
an ancestor of what's being pushed (`E`)? It isn't — `E`'s history
goes back through `C`, `B`, `A`, and never passes through `D` at all.
A normal push would have been rejected here with "updates were
rejected because the remote contains work that you do not have
locally" — the exact protection `--force` bypasses.

## The fix: `--force-with-lease`

**How does `--force-with-lease` avoid the naive force-push's
mistake without giving up the ability to rewrite history at all?**

```js
function forceWithLease(remoteRef, expectedRemoteTip, localTipHash) {
  if (remoteRef.tip !== expectedRemoteTip) {
    throw new Error(
      `rejected: remote tip is ${remoteRef.tip}, expected ${expectedRemoteTip} — someone else pushed`,
    );
  }
  return { ...remoteRef, tip: localTipHash };
}
```

```js
const remoteRef = { name: "main", tip: "D" };

forceWithLease(remoteRef, "C", "E");
// throws: rejected: remote tip is D, expected C — someone else pushed
```

`--force-with-lease` records what the pusher's client believed the
remote tip was at the time of their last fetch (`C`, in the
developer's stale view) and compares it against the _actual_ current
remote tip (`D`) at push time. Because they don't match, the push is
rejected — the developer is forced to fetch, see the teammate's
commit, and reconcile before any history gets overwritten. A plain
`--force` never asks this question at all.

Fetching is only the start of the safe behavior. If fetching shows the
remote now has commits you did not include, you still have to
incorporate them or make an explicit team decision about replacing
them. `--force-with-lease` protects against surprising remote changes;
it does not decide for you whether your rewritten history contains
everything that should remain on the shared branch.

## What generalizes and what doesn't

The core lesson — force-pushing replaces a ref unconditionally, while
a normal push (or `--force-with-lease`) checks the remote's current
state first — generalizes to any system with a similar
"last-write-wins unless checked" hazard: overwriting a file based on
a stale read, or updating a database record without checking it
hasn't changed since it was loaded (a version/optimistic-concurrency
check solves the same underlying problem in that context). What's
specific to this worked example: the exact mechanics (parent
pointers, reachability from a tip) are git's specific model of
history — a different version control system's equivalent safety
check would be built differently, even though the underlying idea
(don't discard changes you haven't seen) is the same. **Try extending
it yourself:** if the developer's rebase had happened to include the
teammate's commit `D` as well (because they'd fetched right before
rebasing), would `commitsLostByForcePush` report anything lost at
all — and does that change what makes a force-push actually risky?

## Failure modes

| Failure mode                                                      | What it gets wrong                                                                                                                               |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Reaching for `--force` reflexively when a normal push is rejected | A rejection means the remote has commits the local branch doesn't — the fix is to fetch and reconcile, not to bypass the check that caught it    |
| Treating `--force-with-lease` as equivalent to `--force`          | `--force-with-lease` still checks the remote's actual current state before overwriting — it's meaningfully safer, not just a longer command name |
| Assuming a personal-branch force-push habit is safe on any branch | The same command is safe on a branch nobody else touches and dangerous on a shared one — the branch's status, not the command, is what changed   |
| Fetching, then force-pushing without reading what changed         | A fresh fetch updates your view, but it doesn't mean your local rewritten branch includes the new remote commits — inspect and reconcile first   |
