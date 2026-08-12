---
title: "L3 — Refactoring a div-soup page into semantic HTML, and what actually changes"
---

## The div-soup version

```html
<div class="page">
  <div class="topbar">
    <div class="logo">Acme</div>
    <div class="menu">
      <div class="menu-item" onclick="goTo('/pricing')">Pricing</div>
      <div class="menu-item" onclick="goTo('/docs')">Docs</div>
    </div>
  </div>
  <div class="content">
    <div class="title">Welcome</div>
    <div class="body">Sign up to get started.</div>
    <div class="cta" onclick="signup()">Sign up</div>
  </div>
</div>
```

This renders identically to a well-structured page if the CSS is right — that's exactly the trap. Visually, nothing looks wrong. What's actually broken only shows up when the page is used in a way that doesn't rely on a mouse and eyes: none of the `menu-item` or `cta` divs are keyboard-focusable, none respond to Enter/Space, a screen reader announces "Welcome" and "Sign up" as plain text with no indication either is interactive, and there's no way to jump directly to the content, skipping the top bar.

## The semantic version

```html
<div class="page">
  <header class="topbar">
    <div class="logo">Acme</div>
    <nav class="menu">
      <a href="/pricing" class="menu-item">Pricing</a>
      <a href="/docs" class="menu-item">Docs</a>
    </nav>
  </header>
  <main class="content">
    <h1 class="title">Welcome</h1>
    <p class="body">Sign up to get started.</p>
    <button type="button" class="cta" onclick="signup()">Sign up</button>
  </main>
</div>
```

Same visual result with the same CSS classes — nothing about the _styling_ changed. What changed: `<nav>`/`<a>` are keyboard-focusable and Enter-activatable by default; `<button>` is too, and gets a "button" role and disabled-state handling for free; `<header>`/`<nav>`/`<main>` are real landmarks a screen reader can jump between; `<h1>` gives the page a real heading a screen reader's "jump to heading" command can find. `outer.class="page"` div stays a div deliberately — it has no semantic role of its own, it's purely a styling wrapper, which is exactly the legitimate use case for `<div>`.

## A concrete, checkable model of keyboard accessibility

Whether an interactive element is keyboard-accessible reduces to a checkable rule: is it a native interactive element (`button`, `a` with `href`, `input`, `select`, `textarea`), or does it have both an explicit `tabindex` and the matching keydown handling? This is real, testable logic, independent of any specific DOM:

```js
// accessibility-check.mjs — models the rule as plain data, not real DOM,
// so it's checkable without a browser.
const NATIVE_INTERACTIVE_TAGS = new Set([
  "button",
  "a",
  "input",
  "select",
  "textarea",
]);

function isKeyboardAccessible(el) {
  // el: { tag: string, href?: string, tabIndex?: number, hasKeyHandler?: boolean }
  if (NATIVE_INTERACTIVE_TAGS.has(el.tag)) {
    if (el.tag === "a")
      return typeof el.href === "string" && el.href.length > 0;
    return true;
  }
  // A non-native element only counts if BOTH the focus stop and the
  // keyboard activation were added manually — either alone is broken.
  return el.tabIndex === 0 && el.hasKeyHandler === true;
}

console.log(isKeyboardAccessible({ tag: "button" })); // true
console.log(isKeyboardAccessible({ tag: "a", href: "/docs" })); // true
console.log(isKeyboardAccessible({ tag: "a" })); // false — an <a> with no href isn't a link
console.log(isKeyboardAccessible({ tag: "div", onclick: "signup()" })); // false
console.log(
  isKeyboardAccessible({ tag: "div", tabIndex: 0, hasKeyHandler: true }),
); // true, the hard way
```

The last two lines are the entire argument in code: a `<div onclick>` with nothing else is unconditionally inaccessible, and making a `<div>` accessible by hand requires reproducing _both_ pieces `<button>` already provides — which is strictly more code, more to get right, and more to maintain than just using `<button>` in the first place.

## Failure modes

- **Adding `onclick` without `tabindex` and a keydown handler.** The single most common div-as-button mistake — it works for a mouse, and silently excludes every keyboard-only and switch-device user, with no visual sign anything is wrong.
- **Using `<div tabindex="0">` with a keydown handler but forgetting Space, only handling Enter.** Native buttons respond to both; a hand-rolled one that only checks `Enter` breaks the convention users (and screen readers announcing "button") expect to work.
- **Wrapping everything in `<div>` "to be safe," including things that already have a correct semantic element.** A `<div>` around a `<button>` for styling is fine; replacing the `<button>` itself with a styled `<div>` throws away everything covered above for no benefit — the instinct to reach for `<div>` first, rather than last, is the actual root cause of most of this class of bug.
- **Fixing the visual/keyboard behavior but never checking the accessibility-tree role.** A `<div>` with `tabindex="0"`, a keydown handler, and `role="button"` set explicitly is closer to correct — but `role="button"` alone doesn't add keyboard behavior; it only fixes the announced role. All three pieces (focusable, keyboard-activatable, correct role) have to be present together, which is precisely why the native element is simpler: it has all three by construction, not by assembly.
