---
title: "L2 — The accessibility tree, and what semantic elements give you for free"
---

## Two trees built from the same markup

```mermaid
flowchart LR
    HTML["Your HTML"] --> DOM["DOM tree\n(what JS/CSS operate on)"]
    HTML --> AX["Accessibility tree\n(what screen readers,\nkeyboard nav, voice control read)"]
    AX --> Role["Role: button, nav, heading..."]
    AX --> Name["Accessible name"]
    AX --> State["State: pressed, expanded, disabled..."]
```

The DOM tree is what most web development directly manipulates. The accessibility tree is a second structure the browser derives from the same markup, and it's what every non-visual way of using a page (screen readers, switch devices, voice control, browser "reader mode") actually reads. Semantic elements populate every branch of it correctly by default; a generic `<div>` populates none of it, because a `<div>` has no inherent role — its accessibility-tree entry is just "generic," carrying no information about what it does.

## What a real `<button>` gives you, that a styled `<div>` doesn't

| Behavior                | `<button>`                            | `<div onclick>` styled to look like a button                                                     |
| ----------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Keyboard focusable      | Yes, by default                       | No — needs manual `tabindex="0"`                                                                 |
| Responds to Enter/Space | Yes, by default                       | No — needs manual keydown handlers for both                                                      |
| Announced role          | "button" (accessibility tree)         | "text" or nothing — no role, no announcement                                                     |
| Disabled state          | `disabled` attribute, fully handled   | Requires manually blocking clicks, styling, and updating the accessibility tree's disabled state |
| Form submission         | Works inside a `<form>` automatically | Requires manual JS to replicate                                                                  |

Every row in the right column is real, non-trivial work a developer has to reproduce by hand, get right across browsers, and maintain — and it's exactly the work the browser already does for a real `<button>`. This is the concrete shape of "semantics give you behavior for free."

## Landmarks: navigation for people who can't scan visually

```html
<!-- No landmarks — a screen reader user has to tab through everything -->
<div class="top-bar">...</div>
<div class="side-menu">...</div>
<div class="content">...</div>

<!-- With landmarks — jump directly to a region -->
<header>...</header>
<nav>...</nav>
<main>...</main>
```

A sighted user visually scans a page in an instant to find the main content, skipping the header and nav — that's a real cognitive shortcut. `<header>`, `<nav>`, and `<main>` give a screen reader user the equivalent shortcut: most screen readers offer a "jump to landmark" command that lets them skip straight to `<main>` without tabbing through every link in the header and nav first. A `<div>`-only page structurally cannot offer this, no matter how it's visually styled — the shortcut depends on the tag, not the appearance.

## The decision rule, restated precisely

Semantic HTML isn't "use fancy tag names for style points" — it's "let the browser's built-in behavior do work you'd otherwise have to reimplement, and let assistive technology understand structure it otherwise couldn't infer." The `<div>`/`<span>` pair exists specifically for the remaining case: a piece of markup with no inherent semantic role, needed purely for styling or JS hooks — which is a real, legitimate case, just a narrower one than how `<div>` usually gets used in practice.
