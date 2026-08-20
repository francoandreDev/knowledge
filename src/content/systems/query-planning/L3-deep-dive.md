---
title: "L3 — Measuring the N+1 bug, fixing it, and a real denormalization trade-off"
---

## Reproducing the Scenario's bug with a real query counter

**Here's a simple in-memory database and query counter — enough to
measure query count directly, without needing a real database
server. What does the naive version of the Scenario's endpoint
actually do?**

```js
let queryCount = 0;

function findCustomerById(db, id) {
  queryCount++;
  return db.customers.find((c) => c.id === id);
}

function findAllOrders(db) {
  queryCount++;
  return db.orders;
}

function listOrdersWithCustomerNaive(db) {
  const orders = findAllOrders(db);
  return orders.map((order) => {
    const customer = findCustomerById(db, order.customerId);
    return { ...order, customerName: customer.name };
  });
}
```

```js
const db = makeDb(500, 50000); // 500 customers, 50,000 orders

queryCount = 0;
listOrdersWithCustomerNaive(db);
console.log(queryCount); // 50001
```

`findAllOrders` runs once, and `findCustomerById` runs once per
order inside the `.map()` callback — for 50,000 orders, that's 50,000
separate lookups plus the original 1, exactly matching the N+1
pattern from L2's diagram. This is the mechanical cause of the
Scenario's slowdown, made directly measurable rather than just
inferred from "it got slower."

## The fix: fetch everything needed in one pass

**What changes if the customer lookups happen once, up front, instead
of once per order?**

```js
function listOrdersWithCustomerJoined(db) {
  queryCount++;
  const customerById = new Map(db.customers.map((c) => [c.id, c]));
  return db.orders.map((order) => ({
    ...order,
    customerName: customerById.get(order.customerId).name,
  }));
}
```

```js
queryCount = 0;
listOrdersWithCustomerJoined(db);
console.log(queryCount); // 1
```

Instead of looking up each order's customer individually, this builds
one `Map` from every customer's id to their record — a single query —
and then looks up each order's customer from that in-memory map,
which costs nothing extra in query count no matter how many orders
there are. The `.map()` over orders still runs once per order, but
that's in-memory JavaScript work, not a separate database round-trip
— the thing that actually scales badly. A real SQL database achieves
the same result with a `JOIN` clause; the underlying idea (fetch
related data together, not one row at a time) is identical.

**Does this fix mean query count stops mattering as the data grows?**
No — it goes from _scaling with the number of orders_ to being
_constant regardless of the number of orders_, which is the actual
fix. 50,000 orders now costs the same 1 query that 20 orders does.

## A real denormalization trade-off

**Suppose this endpoint is called on every page load and customers
almost never rename themselves. Would denormalizing the customer name
directly onto each order make sense here?**

```js
function createOrderDenormalized(db, customerId, orderDetails) {
  const customer = db.customers.find((c) => c.id === customerId);
  const order = {
    ...orderDetails,
    customerId,
    customerName: customer.name, // duplicated at write time
  };
  db.orders.push(order);
  return order;
}

function renameCustomer(db, customerId, newName) {
  const customer = db.customers.find((c) => c.id === customerId);
  customer.name = newName;
  // every order that duplicated the old name must also be updated
  for (const order of db.orders) {
    if (order.customerId === customerId) {
      order.customerName = newName;
    }
  }
}
```

Reading an order's customer name now costs nothing extra — it's
already on the record, no lookup needed at all, not even the
in-memory `Map` from the joined version. The cost moved to
`renameCustomer`, which now has to find and update every order
belonging to that customer, not just the customer record itself. If
renames are rare and reads happen constantly, this trade is a clear
win; if renames were frequent, this same change would make
`renameCustomer` the new bottleneck instead.

## What generalizes and what doesn't

The core lesson — a query pattern's cost scales with what it _does
per item in a list_, not with the size of any single query — applies
to any list-then-fetch-related-data pattern, in SQL databases, NoSQL
databases, or even in-process code calling a remote API per item in a
loop. What's specific to this worked example: the exact fix (build a
lookup map, or use a SQL `JOIN`) applies to this specific
one-list-one-related-table shape — a query needing data from three or
four related tables needs the same _principle_ (fetch together, not
per-item) applied to a more complex join or a differently-shaped
batch fetch. **Try extending it yourself:** if each order also needed
its list of line items (a one-to-many relationship, not the
one-to-one customer lookup used here), would the same single-`Map`
fix still work directly, or does a one-to-many relationship need a
different batching approach?

## Failure modes

| Failure mode                                                                             | What it gets wrong                                                                                                                                             |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Assuming a slow endpoint means the database server needs to be upgraded                  | A faster server reduces the cost per query, but does nothing about a query count that scales with list size — the pattern itself needs fixing                  |
| Denormalizing data without updating every place the original write path could add a copy | A duplicated field is only safe if every write path that creates or changes the original also updates the duplicate — missing one silently produces stale data |
| Only load-testing with data volumes similar to development                               | An N+1 pattern can be invisible at small scale and severe at production scale — this unit's Scenario is exactly that gap                                       |
| Fixing the query count but not verifying the fix actually reduces round-trips            | A rewritten query that still hides a loop of separate lookups behind different-looking code hasn't actually fixed the underlying pattern                       |
