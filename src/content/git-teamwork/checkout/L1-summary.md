---
title: "L1 — How do I undo a mistake without losing everything?"
---

- Git has three different "undo" commands that get used interchangeably in casual speech but do genuinely different things: **`checkout`** (move between commits/branches, or restore specific files), **`revert`** (create a _new_ commit that undoes an old one), and **`reset`** (move a branch pointer backward, optionally touching the working directory too).
- The critical distinction: some undo operations **rewrite history** (reset, an old-style checkout that moves your branch), others **add to it** (revert) — this matters enormously the moment more than one person shares the branch, because rewritten history that's already been shared creates real conflicts for everyone else.
- `reset` has three modes that differ in how much they touch: `--soft` (move the branch pointer only, keep everything staged), `--mixed` (also unstage, but keep working-directory files as they are — the default), `--hard` (also overwrite working-directory files to match — **this one can destroy uncommitted work with no recovery path**).
- `revert` is the safe default for anything already pushed/shared: it doesn't erase the mistake from history, it adds a new commit that cancels it out — history stays append-only, which is exactly why it's safe on a shared branch where `reset` would not be.
- `checkout` (and its modern split, `switch`/`restore`) is the most overloaded of the three verbs historically — it can switch branches, detach HEAD to an old commit, or restore individual files from another commit, and conflating those three different actions under one command name is a real, common source of confusion.
- The single most dangerous command in this unit is `git reset --hard` on a branch with uncommitted changes — it silently, irrecoverably discards them, no confirmation prompt, no undo. Everything else here has some recovery path; that combination often doesn't.
- The practical rule this unit builds: before undoing anything, know whether the target commit is still only local (safe to rewrite) or already shared (rewrite only with real coordination, or don't rewrite at all — revert instead).
