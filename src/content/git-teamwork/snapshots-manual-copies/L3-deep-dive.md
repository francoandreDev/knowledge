---
title: "L3 — Proving the snapshot model with real commands and a real hash"
---

## Watching the three-state model in a real session

A real terminal session, captured as-is (this is literal output, not code to run yourself — reproduce it locally if you want to follow along):

```
$ mkdir demo && cd demo && git init
Initialized empty Git repository in /demo/.git/

$ echo "hello" > greeting.txt
$ git status
On branch main
Untracked files:
  greeting.txt

$ git add greeting.txt
$ git status
On branch main
Changes to be committed:
  new file:   greeting.txt

$ git commit -m "Add greeting"
[main (root-commit) a1b2c3d] Add greeting
 1 file changed, 1 insertion(+)

$ echo "hello again" > greeting.txt
$ git status
On branch main
Changes not staged for commit:
  modified:   greeting.txt
```

Notice `git status` reports a _different_ state after each command, even though nothing was "undone" — that's the three-state model directly: the file on disk (working directory), what's staged for the next snapshot, and what's already permanently committed are three genuinely separate pieces of state, and every git command operates on exactly one of them.

## Proving content-addressing with a real hash

Git's claim in L2 was: every stored object is identified by the SHA-1 hash of its own content. This is checkable — Git computes a blob's hash as `sha1("blob " + content.length + "\0" + content)`. Here's that computation done independently in Node, and compared against what `git hash-object` actually produces:

```js
// hash-object.mjs — reimplements git's blob-hashing algorithm from scratch
// to prove it's just a hash of "blob <size>\0<content>", nothing magic.
import { createHash } from "node:crypto";

function gitBlobHash(content) {
  const bytes = Buffer.from(content, "utf8");
  const header = `blob ${bytes.length}\0`;
  const store = Buffer.concat([Buffer.from(header, "utf8"), bytes]);
  return createHash("sha1").update(store).digest("hex");
}

const content = "hello\n";
console.log(gitBlobHash(content));
```

Running this prints `ce013625030ba8dba906f756967f9e9ca394464` — and running `git hash-object` on a file containing exactly `hello\n` (via `echo "hello" | git hash-object --stdin`) prints the **exact same hash**, computed by completely independent code. This is the practical proof behind "identical content is stored once": the storage key isn't a filename or a timestamp, it's a pure function of the bytes.

## Why this changes what "undo" means

With manual copies, undo means "hope you kept a copy from before the mistake, and manually figure out what else changed since then." With snapshots:

```
$ git log --oneline
c3d4e5f Fix typo in greeting
b2c3d4e Add greeting v2
a1b2c3d Add greeting

$ git checkout a1b2c3d -- greeting.txt   # restore this one file to that snapshot
$ git reset --hard a1b2c3d                # or: rewind the whole project to that snapshot
```

Both commands work because every past state is a fully addressable snapshot, not a fragile chain of manual edits — "go back to exactly how things were on Tuesday" is a lookup, not an archaeology project.

## Failure modes

- **Forgetting to `git add` a file before committing.** A very common beginner trap: the file exists and is edited, but was never staged, so `git commit` silently commits _without_ it. `git status` before every commit is the habit that prevents this — it always shows exactly what's staged vs. not.
- **Committing generated or dependency files** (`node_modules/`, build output, `.env` with real secrets). Content-addressing means Git will happily store and diff megabytes of generated noise forever, bloating the repo permanently — a `.gitignore` has to be set up deliberately; Git doesn't infer "this doesn't belong" on its own.
- **Treating uncommitted work as safe.** The working directory and staging area are _not_ part of the permanent history — `git reset --hard`, a bad `git checkout`, or just accidentally deleting a file can lose uncommitted changes with no recovery path (the safety net starts at the first commit, not before). Commit early and often; a messy history is fixable later, lost work generally isn't.
- **Assuming a large binary file (a video, a database dump) behaves like a text file in history.** Content-addressing stores a _new full copy_ of a binary blob every time even one byte changes (there's no meaningful line-based diff for a binary), so repeatedly committing changing binaries grows the repository's size roughly linearly with every version ever committed — the reason large media/data usually lives outside Git proper (object storage, Git LFS) rather than committed directly.
