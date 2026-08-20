---
title: "L3 — Building a real response cache and an optimistic update with a working rollback"
---

## The naive version, made concrete

**Before fixing anything — what does the naive version actually do
wrong, in code, not just in the abstract?** It re-fetches on every
call with no memory of prior responses, and it makes the caller wait
for the full round trip before returning anything:

```js
async function fetchTasksNaive(fetcher) {
  return fetcher(); // always hits the network, every single call
}

async function toggleTaskNaive(tasks, taskId, patchFn) {
  await patchFn(taskId, {
    done: !tasks.find((t) => t.id === taskId).done,
  }); // caller gets nothing back until this resolves
  return tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t));
}
```

Every call to `fetchTasksNaive` re-runs `fetcher`, even if nothing
changed since the last call. Every call to `toggleTaskNaive` blocks
on `patchFn` before the caller has anything to show — this is
exactly the 800ms gap from the opening scenario.

## A real response cache with stale-while-revalidate

**Before reading the implementation — what does the caller need back
from a cached fetch that a plain `Map.get()` doesn't give them?** Not
just the cached value — also a way to be notified if a background
refresh turns out to disagree with what was just returned, since the
whole point of stale-while-revalidate is correcting the UI after the
fact rather than blocking on it upfront.

```js
function createCache() {
  const store = new Map();
  return {
    get: (key) => store.get(key),
    set: (key, value) => store.set(key, value),
    has: (key) => store.has(key),
  };
}

async function fetchTasksCached(cache, key, fetcher, onUpdate) {
  const cached = cache.get(key);
  if (cached) {
    // Stale-while-revalidate: return the cached value immediately,
    // but still check the server in the background.
    fetcher().then((fresh) => {
      if (JSON.stringify(fresh) !== JSON.stringify(cached)) {
        cache.set(key, fresh);
        onUpdate(fresh);
      }
    });
    return cached;
  }
  const fresh = await fetcher();
  cache.set(key, fresh);
  return fresh;
}
```

```js
const cache = createCache();
let fetchCount = 0;
const fetcher = async () => {
  fetchCount++;
  return [{ id: 1, title: "Buy milk", done: false }];
};

const first = await fetchTasksCached(cache, "tasks", fetcher, () => {});
// fetchCount === 1 — first call has no cache, must hit the network

const second = await fetchTasksCached(cache, "tasks", fetcher, () => {});
// second === first, returned instantly from the cache —
// fetchCount is still 1 at the moment this line returns
// (the background revalidation increments it to 2 shortly after)
```

**Try tracing through what happens if the server's data actually
changed between the first and second call** — the second call still
returns the _old_ cached value immediately (this is the "stale" part
of stale-while-revalidate), and only after the background `fetcher()`
call resolves does `onUpdate` fire with the corrected data. This is
node-verified: given a `fetcher` that returns different data on its
second call, `onUpdate` fires with exactly that changed data, not the
stale cached version — the UI briefly shows stale data, then self-corrects.

## Optimistic updates with a real rollback

**What does `toggleTaskOptimistic` need to remember before it changes
anything, so a failure can be undone precisely rather than
approximately?** The exact prior state — not "re-fetch and hope it's
right," but the specific snapshot of `tasks` from before the
optimistic change was applied:

```js
function toggleTaskOptimistic({
  tasks,
  taskId,
  patchFn,
  onOptimisticUpdate,
  onRollback,
}) {
  const index = tasks.findIndex((t) => t.id === taskId);
  const optimisticTasks = tasks.map((t) =>
    t.id === taskId ? { ...t, done: !t.done } : t,
  );
  onOptimisticUpdate(optimisticTasks); // UI updates immediately
  return patchFn(taskId, { done: optimisticTasks[index].done })
    .then(() => optimisticTasks) // server confirmed — nothing else to do
    .catch((err) => {
      onRollback(tasks); // restore the exact snapshot from before
      throw err; // still surface the failure — don't swallow it
    });
}
```

**Success path, verified:**

```js
const tasks = [{ id: 1, title: "Buy milk", done: false }];
let optimisticSeen = null;
const successPatch = async () => ({ ok: true });

const result = await toggleTaskOptimistic({
  tasks,
  taskId: 1,
  patchFn: successPatch,
  onOptimisticUpdate: (t) => {
    optimisticSeen = t;
  },
  onRollback: () => {
    /* not called on success */
  },
});
// optimisticSeen[0].done === true — shown before patchFn even resolved
// result[0].done === true — server agreed, nothing to correct
```

**Failure path, verified:**

```js
const tasks2 = [{ id: 1, title: "Buy milk", done: false }];
let rolledBackTo = null;
const failPatch = async () => {
  throw new Error("Server rejected");
};

try {
  await toggleTaskOptimistic({
    tasks: tasks2,
    taskId: 1,
    patchFn: failPatch,
    onOptimisticUpdate: () => {},
    onRollback: (t) => {
      rolledBackTo = t;
    },
  });
} catch (err) {
  // err.message === "Server rejected" — the failure isn't swallowed
}
// rolledBackTo[0].done === false — restored to the exact pre-click state
// tasks2[0].done === false — the original array was never mutated in place
```

The optimistic checkbox appears checked the instant the user clicks
— then, if the server actually rejects the write, it snaps back to
unchecked and the caller still learns about the failure (the
`throw` inside `.catch` isn't optional — swallowing it there would
recreate the exact "UI silently lies" failure mode from L2).

## What generalizes and what doesn't

The pattern — snapshot before changing, apply the optimistic change,
restore the snapshot and surface the error on failure — generalizes
to any optimistic write: reordering a list, editing text inline,
liking a post. What's specific to this worked example: a single-field
boolean toggle is the simplest possible optimistic update, because
there's exactly one prior value to remember. **Try extending it
yourself:** what would `onRollback` need to account for if two
different optimistic updates to the _same_ task were in flight at
once — say, the user toggles "done" and edits the title within the
same second, and only the second request fails? Does restoring "the
snapshot from before this specific change" still work if a different,
still-pending change already modified the array in between?

## Failure modes

| Failure mode                                                                           | What it gets wrong                                                                                                                                                                          |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Caching a GET response and never invalidating it after a related write                 | A cached list that never learns about a write made through a different code path will keep showing outdated data indefinitely — cache and write paths need to agree on when data goes stale |
| Restoring rollback state by re-fetching instead of using a snapshot                    | A re-fetch after a failure can race with _other_ changes made in the meantime, potentially reverting more than just the failed update                                                       |
| Catching the server error inside `onRollback` and not re-throwing it                   | The UI ends up visually correct (rolled back) but the caller — and the user — never learns the write actually failed                                                                        |
| Applying an optimistic update without ever checking the server's actual response value | Assuming the optimistic value is always correct skips the case where the server accepts the write but transforms it (e.g. server-side validation changes the stored value)                  |
