---
title: "L3 — A real incident caused by a responsibility violation, and the refactor that actually fixes it"
---

## The scenario: one class, three reasons to change, one real bug

A `MonthlyReportGenerator` class fetches usage data, calculates billing totals, and renders a PDF — three steps that all "belong to generating the report" in a surface reading, but represent three genuinely independent reasons to change: the data source might change (a new usage-tracking system), the billing calculation might change (a new pricing tier), and the PDF layout might change (a rebrand).

```js
// BEFORE — three responsibilities, one class
class MonthlyReportGenerator {
  async generate(accountId, month) {
    // Reason 1: how usage data is fetched
    const usage = await db.query(
      "SELECT * FROM usage_events WHERE account_id = ? AND month = ?",
      [accountId, month],
    );

    // Reason 2: how billing is calculated
    const total = usage.reduce((sum, event) => {
      const rate = event.type === "api_call" ? 0.001 : 0.01;
      return sum + event.quantity * rate;
    }, 0);

    // Reason 3: how the PDF is laid out
    const pdf = new PDFDocument();
    pdf.fontSize(18).text("Monthly Report", { align: "center" });
    pdf.fontSize(12).text(`Total: $${total.toFixed(2)}`);
    return pdf;
  }
}
```

## The incident this shape actually caused

A designer requests a rebrand: new fonts, new header layout, a logo added to the PDF. An engineer makes the change, editing the `generate` method's PDF-layout lines. While doing so, they accidentally also modify the adjacent billing-calculation line (a stray edit while navigating the same large method) — changing `0.001` to `0.01` for `api_call` events. The rebrand ships. Two weeks later, finance flags that API-call billing is 10x too high for every customer that month.

**The root cause isn't the typo itself — mistakes happen.** The root cause is that a rebrand (a PDF-layout-only change, made by someone focused on layout, likely a frontend-leaning engineer or even a designer pairing with one) required editing a method that also contained unrelated, financially-sensitive billing logic, sitting close enough in the same function to be touched by accident with no test isolating it from layout changes.

## The fix: split along the three actual reasons to change

```js
// AFTER — three responsibilities, three units, each independently testable and changeable
class UsageDataFetcher {
  async fetch(accountId, month) {
    return db.query(
      "SELECT * FROM usage_events WHERE account_id = ? AND month = ?",
      [accountId, month],
    );
  }
}

class BillingCalculator {
  calculateTotal(usageEvents) {
    return usageEvents.reduce((sum, event) => {
      const rate = event.type === "api_call" ? 0.001 : 0.01;
      return sum + event.quantity * rate;
    }, 0);
  }
}

class ReportPdfRenderer {
  render(total) {
    const pdf = new PDFDocument();
    pdf.fontSize(18).text("Monthly Report", { align: "center" });
    pdf.fontSize(12).text(`Total: $${total.toFixed(2)}`);
    return pdf;
  }
}

class MonthlyReportGenerator {
  constructor(fetcher, calculator, renderer) {
    this.fetcher = fetcher;
    this.calculator = calculator;
    this.renderer = renderer;
  }
  async generate(accountId, month) {
    const usage = await this.fetcher.fetch(accountId, month);
    const total = this.calculator.calculateTotal(usage);
    return this.renderer.render(total);
  }
}
```

The rebrand now only touches `ReportPdfRenderer` — `BillingCalculator`'s rate logic isn't in the same file, isn't visually adjacent, and can have its own dedicated, protected test suite (`billing-calculator.test.mjs`, testing rates directly) that a layout-focused PR wouldn't even run against unless it actually changed billing code. The bug that shipped in the "before" version becomes structurally much harder to cause by accident in the "after" version — not impossible, but no longer one stray line away in an unrelated part of a shared method.

## Failure modes

- **Believing the split alone prevents the bug.** The refactor reduces the _chance_ of an accidental cross-responsibility edit — it doesn't make it impossible (someone could still edit `BillingCalculator` incorrectly on purpose or by confusion). The real protection is the combination of separation _and_ a dedicated billing test suite that would have caught the `0.001`→`0.01` change regardless of which file it happened in.
- **Splitting reactively, only after an incident, instead of applying the reasons-to-change test proactively.** This incident is a clear, retrospective justification — but the test from L2 could have flagged this responsibility violation during the original code review, before any bug shipped, by simply asking "what are the distinct reasons this method might need to change."
- **Over-rotating after one incident into splitting everything defensively.** Per L2's overcorrection warning, the lesson from this incident is "split along genuinely independent reasons to change," not "always prefer more, smaller classes" — applying that overcorrected lesson to code with no real independent-change pattern reintroduces the over-engineering cost for no matching benefit.
- **Assuming this class of bug is rare enough not to worry about.** Editing unrelated code that happens to sit nearby is a common, easy mistake — not a rare, exotic one — which is exactly why responsibility boundaries matter as a structural safeguard, not just as an aesthetic preference for how code reads.
