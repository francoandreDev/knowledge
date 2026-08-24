---
title: "L2 — The ten categories, how they relate, and how attackers actually pick a target"
---

## Why a "top 10" instead of a single definition of "secure"

**If a system has strong crypto, strong auth, and TLS everywhere, is
it secure?** Not necessarily — those cover exactly three of the ten
categories below. A system can max out all three and still be
breached through any of the other seven:

| #   | Category                                   | What it actually means                                                                            | Covered elsewhere in this track                                                |
| --- | ------------------------------------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1   | Broken access control                      | Right identity, wrong permission check (or none)                                                  | Related to `/security/authorization-models/`, but IDOR is this unit's L3 focus |
| 2   | Cryptographic failures                     | Sensitive data exposed because it wasn't encrypted, or was encrypted badly                        | `/security/hashing/`, `/security/symmetric-asymmetric-encryption-basics/`      |
| 3   | Injection                                  | Untrusted input executed as code by a downstream interpreter                                      | New in this unit — L3 focus                                                    |
| 4   | Insecure design                            | The flaw is in the requirements/architecture, not a single line of code                           | Touched by `secure-by-design` (later unit)                                     |
| 5   | Security misconfiguration                  | Insecure by default setup, not by broken logic                                                    | New in this unit                                                               |
| 6   | Vulnerable and outdated components         | A dependency has a known, unpatched CVE                                                           | Related to `supply-chain-security` (later unit)                                |
| 7   | Identification and authentication failures | Login, session, or credential-recovery logic has a gap                                            | `/security/authentication-fundamentals/`                                       |
| 8   | Software and data integrity failures       | Code or data trusted without verifying where it came from                                         | Related to `supply-chain-security` (later unit)                                |
| 9   | Security logging and monitoring failures   | A breach happens and nobody notices for months, because nothing was logged or watched             | Related to `incident-response` (later unit)                                    |
| 10  | Server-side request forgery (SSRF)         | The server itself is tricked into making a request to somewhere the attacker can't reach directly | New in this unit — L3 focus                                                    |

**Is this list saying the other units in this track don't matter?**
No — getting authentication, hashing, and TLS right closes off three
real categories of attack. The point is that closing three doesn't
close the other seven, and treating "we did auth and crypto" as
"we're secure" is exactly the mistake the Scenario's company made.

## How an attacker actually picks a target

**Does an attacker start with the system's strongest defense and try
to break it?** No — that's the least efficient path, and attackers
are economically motivated: they look for whichever category on this
list has the cheapest exploit, not the most impressive one.

```mermaid
flowchart LR
    A["Map the attack surface\n(every endpoint, field, dependency)"] --> B{"Which category\nhas the cheapest gap?"}
    B -->|"missing owner check"| C["Broken access control"]
    B -->|"string-built query"| D["Injection"]
    B -->|"stale staging route"| E["Security misconfiguration"]
    B -->|"known CVE, unpatched"| F["Vulnerable components"]
    C --> G["Exploit — usually boring,\nrarely a zero-day"]
    D --> G
    E --> G
    F --> G
```

Read that as a concrete walk, not as a vague "hack the app" cloud:
first the attacker lists places the app accepts input, then tries cheap
assumptions one by one. Can I change an invoice id? Can I put strange
text in a search box? Is there an old staging route still online? Is a
dependency version tied to a known public flaw, a CVE? A **zero-day**
is a previously unknown flaw; most incidents do not need one.

**Why does this matter for how a team prioritizes security work?**
If the real attack process is "find the cheapest gap across ten
categories," then investing everything into hardening one category
(say, crypto) while leaving another (say, access control) unchecked
doesn't reduce risk proportionally — it just means the breach comes
through whichever category was left weakest, which is exactly what
happened in the Scenario.

## Failure modes at this level

- **Treating "secure" as a single yes/no property.** A system is
  secure against specific categories of attack, to varying degrees —
  not secure in the abstract. "We did a security review" means
  little without knowing which categories it covered.
- **Assuming exotic attacks are the main risk.** Real breaches are
  overwhelmingly boring: a missing ownership check, a leftover debug
  route, a dependency nobody updated — not a novel cryptographic
  break.
- **Fixing the category that's easiest to demo, not the one that's
  actually weakest.** Teams sometimes over-invest in visible controls
  (a security banner, a compliance certificate) while an unglamorous
  category like access control or misconfiguration stays untested.
