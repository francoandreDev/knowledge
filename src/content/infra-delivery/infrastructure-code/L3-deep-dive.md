---
title: "L3 — Building a real plan/apply engine, and reproducing the opening scenario's drift"
---

## Computing a plan: create, update, delete

**Before writing `apply` — what does `plan` actually need to compare
to produce a correct create/update/delete list?** Two lists of
resources — the desired (declared) state and the current (state
file) — matched up by id, then diffed by config:

Code vocabulary before the function: a `Map` is a lookup table where
you can ask "give me the resource with id `web-1`"; `id` is the stable
name used to match the same resource across lists; `config` is the part
that can change, like server size; and `JSON.stringify` is used here as
a simple way to compare two small config objects. Real IaC tools use
more careful comparisons, but the idea is the same.

```js
function diffResources(desired, current) {
  const desiredById = new Map(desired.map((r) => [r.id, r]));
  const currentById = new Map(current.map((r) => [r.id, r]));
  const toCreate = [];
  const toUpdate = [];
  const toDelete = [];

  for (const [id, res] of desiredById) {
    if (!currentById.has(id)) {
      toCreate.push(res);
    } else {
      const existing = currentById.get(id);
      if (JSON.stringify(existing.config) !== JSON.stringify(res.config)) {
        toUpdate.push(res);
      }
    }
  }
  for (const [id, res] of currentById) {
    if (!desiredById.has(id)) {
      toDelete.push(res);
    }
  }
  return { toCreate, toUpdate, toDelete };
}
```

**Before reading the apply function — what should happen to a
resource that's in both the desired and current lists with identical
config?** Nothing — it shouldn't appear in any of the three lists at
all, which is exactly what makes the second `plan` call in the test
below come back empty.

```js
function applyPlan(cloud, plan) {
  const newCloud = new Map(cloud);
  for (const res of plan.toCreate) newCloud.set(res.id, { ...res });
  for (const res of plan.toUpdate) newCloud.set(res.id, { ...res });
  for (const res of plan.toDelete) newCloud.delete(res.id);
  return newCloud;
}
```

## Verifying idempotency: apply once, apply again, nothing changes

```js
const desired1 = [
  { id: "web-1", type: "server", config: { size: "small" } },
  { id: "db-1", type: "database", config: { size: "medium" } },
];
const cloud0 = new Map();

const plan1 = diffResources(desired1, []);
// plan1.toCreate.length === 2 — both resources are new

const cloud1 = applyPlan(cloud0, plan1);
// cloud1.size === 2 — both now exist

const stateFile1 = [...cloud1.values()];
const plan2 = diffResources(desired1, stateFile1);
// plan2.toCreate.length === 0
// plan2.toUpdate.length === 0
// plan2.toDelete.length === 0
// — re-planning against the SAME desired config finds nothing to do
```

This is idempotency, demonstrated rather than asserted: `apply` was
called with real changes the first time and would be called with an
empty plan (a genuine no-op) the second time, for the exact same
input `desired1` — this is what makes it safe to re-run after a
failure without worrying about duplicating anything.

## A real update, and a real delete

**What should change in the plan if `web-1`'s desired size changes
from `small` to `large`, versus if `web-1` is removed from the
desired config entirely?** Two different outcomes, and the diff
function needs to tell them apart correctly:

```js
const desired2 = [
  { id: "web-1", type: "server", config: { size: "large" } }, // resized
  { id: "db-1", type: "database", config: { size: "medium" } },
];
const plan3 = diffResources(desired2, stateFile1);
// plan3.toUpdate.length === 1, plan3.toUpdate[0].id === "web-1"
// plan3.toCreate.length === 0, plan3.toDelete.length === 0
// — a config change on an existing id is an update, not create+delete

const desired3 = [{ id: "db-1", type: "database", config: { size: "medium" } }];
const plan4 = diffResources(desired3, stateFile1);
// plan4.toDelete.length === 1, plan4.toDelete[0].id === "web-1"
// — removing a resource from desired config marks it for deletion
```

## Reproducing the opening scenario's drift, exactly

**Now the actual failure mode from L1 — someone resizes `web-1`
directly in the console, bypassing the tool entirely. Does the state
file know?** No — and that's the point. The state file still says
whatever was last applied through the tool; only a direct comparison
against the _real_ cloud state reveals the gap:

```js
function detectDrift(stateFile, actualCloud) {
  const drifted = [];
  for (const res of stateFile) {
    const actual = actualCloud.get(res.id);
    if (!actual) {
      drifted.push({ id: res.id, reason: "deleted outside IaC" });
    } else if (JSON.stringify(actual.config) !== JSON.stringify(res.config)) {
      drifted.push({ id: res.id, reason: "config changed outside IaC" });
    }
  }
  return drifted;
}

const actualCloudWithDrift = new Map(cloud1);
actualCloudWithDrift.set("web-1", {
  id: "web-1",
  type: "server",
  config: { size: "xlarge" }, // changed via console, not the tool
});

const drift = detectDrift(stateFile1, actualCloudWithDrift);
// drift.length === 1
// drift[0] === { id: "web-1", reason: "config changed outside IaC" }

const noDrift = detectDrift(stateFile1, cloud1);
// noDrift.length === 0 — when actual matches the state file, nothing to report
```

This is exactly the opening scenario's mechanism, made concrete: the
on-call engineer's console change updated the _actual_ cloud but not
the _state file_ — `detectDrift` catches precisely that gap. And it
also explains what went wrong for the teammate who ran the routine
deploy: their `plan` was computed against `stateFile1` (which still
said `small`), not against the drifted actual state — so their
deploy's plan correctly matched what the _tool_ believed was true,
which by then had silently diverged from reality.

One more step shows the "it got resized back to `small`" part of the
opening scenario. If the tool refreshes from actual cloud before
applying the declared config, it sees that reality is `xlarge` while
the declared file still says `small`, so the computed plan is an update
back to `small`:

```js
const planAgainstActual = diffResources(desired1, [
  ...actualCloudWithDrift.values(),
]);

// planAgainstActual.toUpdate.length === 1
// planAgainstActual.toUpdate[0].id === "web-1"
// planAgainstActual.toUpdate[0].config.size === "small"

const cloudAfterRoutineDeploy = applyPlan(
  actualCloudWithDrift,
  planAgainstActual,
);
cloudAfterRoutineDeploy.get("web-1").config.size; // "small"
```

That update is not malicious and not random. It is the tool obeying the
only declared source of truth it has. The incident fix lived only in
the console, so the next routine deploy treated that console-only
change as something to overwrite.

## What generalizes and what doesn't

The plan → apply → detect-drift cycle generalizes to any declarative
IaC tool (Terraform, CloudFormation, Pulumi) regardless of what kind
of resource is being managed — servers, databases, network rules,
DNS records. What's specific to this worked example: real IaC tools
also handle dependency ordering (create the database before the
server that connects to it), partial-failure recovery mid-apply, and
provider-specific resource schemas that this simplified `Map`-based
simulation skips entirely. **Try extending it yourself:** what would
`diffResources` need to account for if two resources had a
dependency — say, `web-1`'s config referenced `db-1`'s address — and
`db-1` was both being deleted and recreated with a new address in the
same plan? Does "delete `db-1`, then create `web-1`" or "create
`db-1`, then update `web-1`" change which order is actually safe?

## Failure modes

| Failure mode                                                                              | What it gets wrong                                                                                                                                                       |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Manually changing a resource "temporarily" without updating the declared config afterward | Creates exactly the drift from the opening scenario — the state file and reality silently diverge until something detects it or a plan is run                            |
| Writing a script of cloud CLI commands and calling it "Infrastructure as Code"            | An imperative script has no state file to diff against — it can't detect drift or guarantee that re-running it after a failure is safe                                   |
| Applying a plan without reviewing what it says it will create/update/delete               | The plan step exists specifically to catch an unexpected delete before it happens — skipping the review defeats its purpose                                              |
| Assuming idempotency means "running apply twice does literally nothing"                   | It means running it twice produces the same _end state_ — the first run may make real changes; only the second run (against unchanged desired config) is a genuine no-op |
