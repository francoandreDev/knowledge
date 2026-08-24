---
title: "L2 — Trust boundaries and the STRIDE model"
---

## Which of these four arrows actually needs to be questioned?

```mermaid
flowchart LR
    User["Untrusted: user browser"] -- "1. request" --> API["Trust boundary: API server"]
    API -- "2. validated write" --> DB["Trusted: database"]
    ThirdParty["Untrusted: third-party webhook"] -- "3. payload" --> API
    API -- "4. query" --> Cache["Trusted: internal cache"]
```

Arrows 1 and 3 cross from something outside your control into something inside it; arrows 2 and 4 stay entirely within components you already own and already validated. A shocking amount of real vulnerabilities come from code that treats an untrusted-side input (arrow 1 or 3) as if it had already crossed the boundary safely — trusting a client-supplied "isAdmin" field, trusting a webhook payload's claimed sender, trusting a file's declared content-type.

Read the diagram vocabulary this way:

- **Browser**: the app running on a user's device, which the user can
  inspect or manipulate.
- **API server**: your system's front door for requests.
- **Database/cache**: storage your system writes and later reads.
- **Webhook**: a message sent by another system, which still needs proof
  that it really came from who it claims.

<div class="not-prose my-4 grid grid-cols-2 gap-2 text-xs">
  <div class="rounded border border-rose-300 bg-rose-50 p-2 dark:border-rose-800 dark:bg-rose-950">
    <p class="font-semibold text-rose-600 dark:text-rose-400">
      Untrusted side (1, 3)
    </p>
    Anything the caller controls — must be re-verified every time, no exceptions
  </div>
  <div class="rounded border border-emerald-300 bg-emerald-50 p-2 dark:border-emerald-800 dark:bg-emerald-950">
    <p class="font-semibold text-emerald-600 dark:text-emerald-400">
      Trusted side (2, 4)
    </p>
    Data your own system already produced or validated — nothing new to earn
  </div>
</div>

"Trusted" here does not mean "never check it again." It only means the
data is not arriving directly from an outside actor at this moment. Your
own system can still have bugs, stale data, or bad configuration.

## If you had to review a component in five minutes, what six questions would cover the most ground?

| Category                   | The adversary's goal                          | Concrete example                                                           | In simpler words                                  |
| -------------------------- | --------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------- |
| **S**poofing               | Pretend to be someone/something else          | Forging a request header to look like it came from an internal service     | Wearing a fake badge                              |
| **T**ampering              | Alter data or code in transit or at rest      | Modifying a price value in a request before it hits the server             | Changing the number before the cashier sees it    |
| **R**epudiation            | Deny having done something, with no proof     | An admin action with no audit log, so it can't be attributed later         | "Prove I did it" when nobody kept a receipt       |
| **I**nformation disclosure | Read data they shouldn't have access to       | An error message that leaks a stack trace with internal file paths         | A private detail accidentally printed on the page |
| **D**enial of service      | Make the system unavailable to legitimate use | Sending oversized payloads that exhaust server memory                      | Blocking the doorway so real users cannot enter   |
| **E**levation of privilege | Gain access beyond what was granted           | A regular user calling an admin-only endpoint the UI just happened to hide | A visitor finding a staff-only door unlocked      |

STRIDE isn't a checklist of specific bugs to search for — it's a set of _lenses_. Running through all six for any given component ("could someone spoof a caller here? Tamper with this data? Deny they did this?") surfaces categories of risk a purely functional review wouldn't think to ask about, because functional review only asks "does the intended flow work."

## Once you've found ten plausible threats, what do you actually do with the list?

You don't try to fix all ten with equal urgency — you rank them, the same way you'd triage bugs by severity instead of fixing them in file-alphabetical order:

```text
function threat_model(component):
    assets = what_is_valuable_here(component)          # data, access, availability
    entry_points = where_does_untrusted_input_enter(component)

    threats = []
    for entry in entry_points:
        for category in [SPOOFING, TAMPERING, REPUDIATION,
                          INFO_DISCLOSURE, DENIAL_OF_SERVICE, ELEVATION]:
            if plausible(category, entry, assets):
                threats.append((entry, category, worst_case_impact(category, assets)))

ranked = sort_by(threats, key=lambda t: likelihood(t) * impact(t))
return ranked  # highest-priority risks first, not an exhaustive fix-everything list
```

This is pseudocode: it is a recipe, not code meant to run as-is. In
plain steps: list what is valuable, list where outside input enters,
ask the six STRIDE questions for each entry point, then rank the
answers. **Likelihood** means how easy or common the attack seems;
**impact** means how much damage it would cause.

Threat modeling deliberately produces a _ranked_ list, not an infinite one — the point isn't to eliminate all conceivable risk (impossible), it's to know where the highest-value mitigation effort should go.

## What's actually different about the question a security-minded reviewer asks?

A functional reviewer asks: "if a user does X, does the system produce the right result?" A security-minded reviewer asks the same question with one word changed: "if an **adversary** does X — deliberately, with malicious intent, possibly automating it a million times — does the system still behave safely?" Same code, same review, fundamentally different question — and it's the second question that catches the failure modes the first one is structurally blind to, the way it caught Team B's missing rate limit in L1 before a single line of code existed.
