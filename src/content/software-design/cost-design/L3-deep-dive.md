---
title: "L3 — Adding a feature to both versions, and measuring the actual cost difference"
---

## The task: add a second notification channel

Both versions from L2 currently only send email. A new requirement arrives: also send an SMS notification for high-value orders. This is the moment the design cost becomes concrete and measurable, not theoretical.

## Tightly coupled version: the change ripples

```js
// order-service-coupled.mjs
class OrderService {
  completeOrder(order) {
    const emailService = new EmailService();
    const smtpClient = emailService.smtpClient;
    smtpClient.sendRaw(buildMimeMessage(order));

    // Adding SMS means OrderService now has to know about a second
    // concrete service AND branch on business logic (order value) that
    // has nothing to do with "completing an order":
    if (order.total > 500) {
      const smsService = new SmsService();
      smsService.send(order.customerPhone, `Order ${order.id} confirmed`);
    }
  }
}
```

`OrderService` — a class whose job is "complete an order" — now directly imports and instantiates two unrelated concrete services, and contains a business rule about _when_ SMS applies that has nothing to do with order completion. Every future notification channel (push notification, Slack alert for internal orders, a new SMS provider after switching vendors) means editing this same method again, and the method's cyclomatic complexity (branches to reason about) grows every time.

## Loosely coupled version: the change is additive, not invasive

```js
// order-service-decoupled.mjs
class OrderService {
  constructor(notifiers) {
    this.notifiers = notifiers; // array of anything with .notify(order)
  }

  completeOrder(order) {
    for (const notifier of this.notifiers) {
      notifier.notify(order);
    }
  }
}

class EmailNotifier {
  notify(order) {
    /* build and send email */
  }
}

class SmsNotifier {
  notify(order) {
    if (order.total > 500) {
      /* send SMS */
    }
  }
}

// Wiring — the only place that changes to add a channel:
const orderService = new OrderService([new EmailNotifier(), new SmsNotifier()]);
```

`OrderService` itself is **unmodified** — zero lines changed in the class whose actual job is completing orders. The new SMS logic, including its own business rule about which orders qualify, lives entirely inside `SmsNotifier`, which is exactly where "does this order qualify for SMS" belongs — it's SMS-specific policy, not order-completion policy. Adding a fourth channel next quarter means writing one more small class and adding it to the array, never touching `OrderService`, `EmailNotifier`, or `SmsNotifier` again.

## What this proves, concretely

The coupled version required editing the core class and increasing its branching complexity for a change that is, conceptually, purely additive ("also notify via SMS"). The decoupled version made the same change without editing the core class at all — this is the cost curve from L2 made literal: the second design's "next change" cost stayed roughly flat, while the first design's grew, and it will keep growing every time a new channel is added, in exactly the same place, compounding.

## Failure modes

- **Over-engineering ahead of a real need.** If this system will only ever have one notification channel, ever, building the `notifiers` array abstraction upfront is pure cost with no payoff — three similar lines of code are better than a premature interface, per this curriculum's own standing rule. The decoupled design is worth its added complexity specifically _because_ a second channel was a real, concrete requirement, not a hypothetical one.
- **Confusing "more files" with "better design."** Splitting `OrderProcessor` into three classes in L2 only helped because the three responsibilities genuinely change for different reasons. Splitting code into more files that all still change together for the same reason adds navigation overhead without buying any of cohesion's actual benefit — file count is not the metric, independent reasons to change is.
- **Treating technical debt as always bad, or always fine.** A tightly-coupled quick version shipped deliberately to hit a real deadline, with a plan to revisit it, is a reasonable trade — the same code left untouched for two years while three more channels get bolted onto it the same way is debt that's accrued real interest, and the refactor cost by then is much higher than doing it the second time it needed to change.
- **Refactoring for design purity with no change actually driving it.** Rewriting working, rarely-touched code to be "more decoupled" with no upcoming requirement that needs it spends real time and risk (any refactor can introduce a bug) for a benefit that only materializes if a future change actually arrives — matching design investment to expected future change, not applying it uniformly everywhere, is the actual skill this unit is teaching.
