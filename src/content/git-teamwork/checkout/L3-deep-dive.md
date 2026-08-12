---
title: "L3 — Real sessions with reset, revert, and checkout, including the recoverable and unrecoverable cases"
---

## Restoring a single file without touching anything else

A real, common case: one file got broken by an edit, but other uncommitted changes in the same working directory are good and shouldn't be touched.

```
$ git status
On branch main
Changes not staged for commit:
  modified:   config.json    <- accidentally broken
  modified:   feature.js     <- good work, keep this

$ git checkout HEAD -- config.json
$ git status
On branch main
Changes not staged for commit:
  modified:   feature.js
```

Only `config.json` was restored to its last-committed state; `feature.js`'s uncommitted edits were untouched, because `checkout -- <file>` (or the modern `git restore <file>`) targets exactly one file, not the whole working directory. This is the narrow, safe, file-scoped use of `checkout` — distinct from checking out a branch or a commit.

## `reset --hard`: the unrecoverable case, demonstrated safely

```
$ echo "important unsaved work" > notes.txt
$ git status
Untracked files:
  notes.txt

$ git add notes.txt
$ git status
Changes to be committed:
  new file:   notes.txt

$ git reset --hard HEAD
$ git status
On branch main
nothing to commit, working tree clean

$ cat notes.txt
cat: notes.txt: No such file or directory
```

`reset --hard` unstaged _and_ deleted `notes.txt` from disk, because it was newly-created (never committed) — there is no `git` command that recovers a file that was never committed at all; the reflog (covered in `git-teamwork/reflog`) only helps recover _commits_, not uncommitted working-directory content. This is the exact scenario L1 warns about: no confirmation, no undo, and it's indistinguishable from any other `reset --hard` until it's too late.

## `revert` on a shared branch, and what teammates see

```
$ git log --oneline
d4e5f6a (HEAD -> main) Fix typo in README
c3d4e5f Add broken rate-limit check      <- the mistake, already pushed
b2c3d4e Add login endpoint
a1b2c3d Initial commit

$ git revert c3d4e5f
[main 9a8b7c6] Revert "Add broken rate-limit check"

$ git log --oneline
9a8b7c6 (HEAD -> main) Revert "Add broken rate-limit check"
d4e5f6a Fix typo in README
c3d4e5f Add broken rate-limit check
b2c3d4e Add login endpoint
a1b2c3d Initial commit
```

The broken commit (`c3d4e5f`) is still fully visible in history — anyone who already pulled it keeps a perfectly consistent view; they just pull one more commit (`9a8b7c6`) that cancels it out. Nobody's local history conflicts with anyone else's, because nothing was rewritten — this is the entire practical argument for `revert` over `reset` once a commit has left your machine.

## A real decision function

The "has this been shared" question from L2 is directly codeable — this is the same logic a script (or a mental checklist before typing a git command) would use:

```js
// undo-strategy.mjs
function chooseUndoStrategy({ isPushed, teamCoordinatedRewrite }) {
  if (!isPushed) return "reset"; // purely local — safe to rewrite freely
  if (teamCoordinatedRewrite) return "reset-with-force-push"; // the rare, agreed exception
  return "revert"; // the default once anyone else may have seen it
}

console.log(
  chooseUndoStrategy({ isPushed: false, teamCoordinatedRewrite: false }),
); // "reset"
console.log(
  chooseUndoStrategy({ isPushed: true, teamCoordinatedRewrite: false }),
); // "revert"
console.log(
  chooseUndoStrategy({ isPushed: true, teamCoordinatedRewrite: true }),
); // "reset-with-force-push"
```

## Failure modes

- **Running `reset --hard` to "clean up" without checking `git status` first.** The command doesn't ask whether the working directory has anything valuable in it — the habit that prevents this is the same one from `git-teamwork/snapshots-manual-copies`: check status before any command that could discard state, every time, not just when something feels risky.
- **Force-pushing after a `reset` on a branch others have already pulled, without warning anyone.** Even a coordinated rewrite needs everyone to actually re-sync (typically `git fetch` + `git reset --hard origin/branch` on their end) — force-pushing silently just relocates the confusion to whoever pulls next and gets a divergent-history error they don't understand.
- **Using `checkout <commit-hash>` (detached HEAD) and then committing more work there by accident.** This leaves new commits that no branch points to — they're not lost immediately (reflog can usually recover them for a while), but they're also not part of any branch's history until deliberately attached to one, which surprises people who expected `checkout` on a commit to behave like checking out a branch.
- **Reaching for `revert` on a commit that's purely local, never pushed.** `revert` works technically, but it adds a confusing "revert of a revert" pair to history for something that could have just been cleanly `reset` away before anyone ever saw it — the safety `revert` buys only matters once sharing is actually in play.
