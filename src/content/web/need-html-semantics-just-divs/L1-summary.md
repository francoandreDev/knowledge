---
title: "L1 — Why do we need HTML semantics instead of just divs?"
---

- A `<div>` tells the browser nothing about what the content _means_ — only semantic elements (`<nav>`, `<button>`, `<article>`, `<header>`) tell the browser, assistive technology, and search engines what role a piece of content actually plays.
- **The accessibility tree** is a parallel structure the browser builds alongside the DOM specifically for screen readers and other assistive tech — semantic elements populate it with the right role, name, and state automatically; a `<div>` populates it with nothing meaningful, no matter how it's styled.
- A `<div onclick="...">` that looks like a button isn't a button to anyone not using a mouse: it's not keyboard-focusable by default, doesn't respond to Enter/Space, and a screen reader announces it as "text," not "button" — every one of those behaviors is what a real `<button>` gives you for free.
- **"For free" is the actual argument for semantics** — keyboard navigation, focus management, correct screen-reader announcements, and reasonable default styling all come from choosing the right element, and re-implementing all of that manually on a `<div>` is real, ongoing, error-prone work.
- Semantic landmarks (`<nav>`, `<main>`, `<header>`, `<footer>`, `<aside>`) let assistive tech users jump directly to a page region instead of tabbing through everything linearly — a capability a `<div>`-only page simply doesn't offer, regardless of how it's visually laid out.
- This isn't purely an accessibility-compliance argument — search engines also use semantic structure to understand page importance and hierarchy, and semantic HTML is measurably easier for another developer to read cold, because the tag names document intent that CSS classes alone don't guarantee.
- The practical rule: reach for a `<div>` (or `<span>`) only when no existing semantic element fits the content's actual role — treat it as the fallback, not the default.
