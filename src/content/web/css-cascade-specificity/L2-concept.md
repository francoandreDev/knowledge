---
title: "L2 — The cascade algorithm, precisely: origin, specificity, then order"
---

## The four-step sort the browser actually runs

**When two or more declarations target the same property on the same element, how does the browser pick a winner?** Not by "last one wins" — that's only the last of four tiebreakers, and it only gets consulted if every earlier one is a dead tie.

```mermaid
flowchart TD
    A["All declarations matching this element+property"] --> B{"Different origin\nor importance?"}
    B -- "Yes" --> C["Highest wins:\nuser !important > author !important\n> author normal > user normal\n> browser default"]
    B -- "No, tied" --> D{"Different\nspecificity?"}
    D -- "Yes" --> E["Higher specificity wins\n(id, then class, then element — compared\nleft to right, no carrying between columns)"]
    D -- "No, tied" --> F["Last one in source order wins"]
```

Every CSS conflict resolves by walking down this exact chain and stopping at the first step that isn't a tie. Most day-to-day "why didn't my CSS apply" confusion comes from stopping the mental model at step 4 (source order) without checking whether step 2 or step 3 already decided it.

## Specificity as a tuple, not a sum

**If specificity worked by adding up points (id = 100, class = 10, element = 1), what would go wrong?** Nothing, usually — that's the mental shortcut most developers use, and it produces the right ordering almost all the time. But it's not literally how browsers compare: specificity is a **three-part tuple** `(ids, classes, elements)`, compared component by component, left to right, with **no carrying between columns**. 11 classes never add up to "worth more than 1 id" — the comparison stops at the id column and a single id already wins, no matter how many classes the other selector has.

| Selector                 | Tuple `(id, class, element)` |
| ------------------------ | ---------------------------- |
| `#page .toolbar .btn`    | `(1, 2, 0)`                  |
| `.btn-primary`           | `(0, 1, 0)`                  |
| `button.btn`             | `(0, 1, 1)`                  |
| `div p a:hover`          | `(0, 1, 3)`                  |
| `*` (universal selector) | `(0, 0, 0)`                  |

Comparing `(1, 2, 0)` vs. `(0, 1, 0)`: the id column differs (1 vs. 0) — the id column alone decides it, the class and element columns are never even inspected. Comparing `(0, 1, 1)` vs. `(0, 1, 0)`: id ties at 0, class ties at 1, so the element column finally breaks the tie.

## Why some codebases fight this constantly and others never do

```mermaid
xychart-beta
    title "Typical specificity of a single selector, by CSS methodology (id-column weight shown as 100 for scale)"
    x-axis ["Utility-first (Tailwind-style)", "BEM (.block__elem--mod)", "Legacy ID-heavy nesting"]
    y-axis "Approx. specificity score" 0 --> 250
    bar [10, 10, 231]
```

**Why would two methodologies that both use only classes end up equally low, while a third one written with ids and deep nesting sits far above both?** Utility-first and BEM both target elements with a single class almost every time — `(0,1,0)` regardless of how the markup nests, so two utility/BEM rules on the same element are nearly always a source-order tiebreak, which is predictable and cheap to reason about. Legacy nesting like `#page .toolbar .btn` accumulates an id plus several classes just from following the DOM structure — its specificity keeps climbing the deeper the nesting goes, which is exactly why older large codebases develop "specificity wars" that force ever-more-specific overrides, each one making the next override harder.

## Two modern escape valves that don't just re-fight the war

**If `!important` escalates the fight instead of ending it, what actually lets you override something safely?**

```css
/* :where() — the selector still matches, but contributes ZERO specificity */
:where(.legacy-toolbar) .btn {
  background: gray; /* specificity: (0, 0, 0) — trivially overridable later */
}

/* @layer — controls PRIORITY BY LAYER ORDER, before specificity is even compared */
@layer legacy, components;

@layer legacy {
  #page .toolbar .btn {
    background: gray; /* high specificity, but LOWER layer priority */
  }
}

@layer components {
  .btn-primary {
    background: blue; /* low specificity, but HIGHER layer priority — wins */
  }
}
```

`:where()` lets a selector match normally while contributing nothing to the specificity tuple — useful for wrapping legacy selectors you don't want to keep out-competing new ones. `@layer` inserts a brand-new step _before_ specificity comparison in the cascade: declarations in a later-declared layer beat declarations in an earlier layer, **regardless of specificity**, as long as neither uses `!important`. This is why a legacy stylesheet's `#page .toolbar .btn` can be made to lose to a new `.btn-primary` without touching the legacy selector at all — put the legacy CSS in an earlier layer.

## The decision rule, restated precisely

Before adding a CSS rule and expecting it to apply: check origin/importance first (is anything `!important`, or from a different source like a browser default), then compute both selectors' specificity tuples component-by-component, and only fall back to "whichever is later in the file/layer order" once the first two are confirmed tied. Reaching for `!important` or piling on extra classes to "win" is treating symptom, not cause — the actual fix is almost always either lowering the old rule's specificity (`:where()`) or controlling priority directly (`@layer`).
