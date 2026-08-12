---
title: "L1 — Why do we need version control at all?"
---

- The naive alternative to version control is manual copies: `project-final.zip`, `project-final-v2.zip`, `project-final-v2-REAL.zip`. It fails for three reasons at once: no record of _why_ something changed, no safe way to combine two people's edits, and no way to find the exact moment a bug was introduced.
- Git's core idea: instead of tracking _changes_ file-by-file (like "track changes" in a word processor), it takes a **full snapshot** of the entire project every time you commit. Unchanged files aren't re-copied — they're referenced by content hash, so snapshots are cheap even though they're "full."
- Three states every tracked file moves through: **working directory** (what's on disk right now) → **staging area** (what you've marked to include in the next snapshot) → **repository** (the permanent, committed history).
- A **commit** is an immutable snapshot plus metadata: who, when, why (the message), and a pointer to the previous commit — that chain of pointers is the entire history of the project.
- Because every commit points to its parent, history is a chain (usually a graph, once branching enters the picture) you can walk backward through — that's what makes "undo to any past state" possible, not just "undo the last action."
- A **branch** is nothing more than a movable label pointing at a commit — creating one is instant and cheap precisely because it doesn't copy any files, just adds a pointer.
- Distributed means every clone has the _entire history_, not just the latest snapshot — there's no single point of failure, and you can commit, branch, and view history entirely offline.
