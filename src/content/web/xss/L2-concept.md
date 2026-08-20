---
title: "L2 — Why XSS and CSRF need different defenses, and how sanitization and CSP stack"
---

## Two different attacks that both involve a victim's browser

**If both XSS and CSRF exploit a logged-in user's browser, why do
they need different fixes?** Because they exploit fundamentally
different mechanisms, even though both end up abusing a victim's
existing session:

| Attack | What actually happens                                                                                                | What it needs from the victim                                                                    |
| ------ | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| XSS    | Attacker-controlled script executes inside the victim's browser, on the vulnerable site, in the victim's own session | The victim just has to view a page containing the injected script                                |
| CSRF   | The victim's browser is tricked into sending a legitimate, authenticated request the victim never intended           | The victim has to be logged in, and interact with (or just load) something the attacker controls |

**Would sanitizing user input fix a CSRF vulnerability?**
No — sanitization stops attacker-controlled _code_ from executing on
the vulnerable page, but CSRF doesn't involve injecting any code onto
that page at all. It exploits the browser automatically attaching the
victim's cookies to a request sent from somewhere else entirely (a
malicious page, or an email link) — the fix for CSRF is verifying the
request actually came from the site's own page (commonly via a CSRF
token), which is a completely different mechanism from sanitizing
displayed content.

## How XSS actually gets injected: reflected vs. stored

**Does XSS always require an attacker to permanently store something
on the vulnerable site, like the Scenario's comment?** No — there are
two common patterns:

```mermaid
flowchart LR
    A["Reflected XSS"] --> B["Malicious script is part of\na URL or request the victim\nis tricked into clicking"]
    B --> C["Server reflects it back\ninto the page unescaped"]
    C --> D["Script runs once,\nfor that one victim"]

    E["Stored XSS"] --> F["Malicious script is saved\nto the site's own data\n(e.g., a comment)"]
    F --> G["Server serves it back\nunescaped to every visitor"]
    G --> H["Script runs for\nevery visitor who views it"]
```

The Scenario is **stored XSS** — the malicious comment is saved once
and served to every subsequent visitor, which is generally more
severe than reflected XSS (which requires tricking one specific
victim into clicking a crafted link) because it affects everyone who
simply views the page normally.

## Sanitization and CSP as independent, stacked layers

**If sanitization already prevents the script from being injected,
what does CSP add on top of that?** Sanitization is the primary
defense — done correctly, it prevents the injection from happening at
all. CSP is a second, independent layer: even if a sanitization bug
somewhere lets a script through, a correctly configured CSP can still
block that script from executing or from sending data to an
attacker's server, because the browser itself enforces which sources
are allowed to run.

**Does having a CSP mean sanitization can be skipped?** No — CSP is
a safety net for when the primary defense fails, not a replacement
for it. Relying on CSP alone, without sanitizing input, still lets an
attacker inject script that runs in the page (CSP mainly restricts
_where_ scripts can load from and _what_ they can do, not whether
inline injected markup renders at all under every possible
configuration) — the two are meant to work together, not as
alternatives.

## Failure modes at this level

- **Treating XSS and CSRF as the same problem with one shared fix.**
  Sanitizing displayed content does nothing to prevent a forged
  authenticated request, and a CSRF token does nothing to stop an
  injected script from executing.
- **Assuming only stored input needs sanitizing.** Reflected XSS
  shows that even data that's never permanently saved can still be
  dangerous if it's echoed back into a page unescaped.
- **Treating CSP as a substitute for sanitizing input.** CSP reduces
  the damage an injected script can do; it doesn't reliably prevent
  the injection from happening in the first place.
