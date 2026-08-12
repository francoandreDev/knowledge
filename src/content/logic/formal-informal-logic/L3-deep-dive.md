---
title: "L3 — Checking validity mechanically, and where these fallacies show up in real engineering arguments"
---

## Checking validity with a real truth-table evaluator

Validity has a mechanical definition ("no case where premises are true and conclusion is false"), which means it's checkable by brute force for a small number of variables — this is a real, runnable proof that the four patterns from L2 are exactly as valid/invalid as claimed, not just asserted:

```js
// validity-checker.mjs — brute-force truth-table validity check.
// For n boolean variables, try all 2^n assignments; an argument is valid
// iff there is NO assignment where every premise is true but the
// conclusion is false.
function isValid(variableNames, premises, conclusion) {
  const n = variableNames.length;
  for (let bits = 0; bits < 2 ** n; bits++) {
    const env = {};
    variableNames.forEach((name, i) => {
      env[name] = Boolean((bits >> i) & 1);
    });

    const allPremisesTrue = premises.every((p) => p(env));
    const conclusionTrue = conclusion(env);

    if (allPremisesTrue && !conclusionTrue) {
      return { valid: false, counterexample: env };
    }
  }
  return { valid: true };
}

// Modus ponens: if P then Q; P; therefore Q
const modusPonens = isValid(
  ["P", "Q"],
  [(e) => !e.P || e.Q, (e) => e.P], // "if P then Q" as (not P) or Q
  (e) => e.Q,
);
console.log("Modus ponens:", modusPonens); // { valid: true }

// Affirming the consequent: if P then Q; Q; therefore P
const affirmingConsequent = isValid(
  ["P", "Q"],
  [(e) => !e.P || e.Q, (e) => e.Q],
  (e) => e.P,
);
console.log("Affirming the consequent:", affirmingConsequent);
// { valid: false, counterexample: { P: false, Q: true } }
```

The counterexample the checker finds — `P: false, Q: true` — is exactly the real-world case that breaks the alert-firing example from L2: the deploy didn't fail (`P` false) but the alert fired anyway (`Q` true) for some other reason. The code doesn't know anything about deploys or alerts; it's purely checking whether the _shape_ forces the conclusion, which is the entire point of formal logic — the same checker validates or invalidates any argument you can express in these terms, regardless of subject matter.

## Where this shows up in real engineering arguments

**Affirming the consequent in root-cause analysis.** "This class of bug is usually caused by a race condition. This crash has that signature. Therefore it's a race condition." Structurally identical to the alert example — the signature being consistent with a race condition doesn't rule out the other causes that produce the same signature. The fix isn't to distrust the hypothesis, it's to look for a way to falsify it (a way P being false would still be consistent with what you're seeing) before treating it as settled.

**Denying the antecedent in postmortems.** "If we'd had better test coverage, this wouldn't have shipped. We do have good test coverage. Therefore this class of failure won't recur." This denies the antecedent: good coverage not preventing _this_ incident doesn't mean coverage prevents nothing — but the fallacy is being used here to falsely rule out that _other_ gaps exist, based on one gap having been closed.

**Confusing correlation-shaped premises with logical ones.** "Every senior engineer I've worked with writes extensive tests. Therefore extensive tests make you a senior engineer." Even setting aside that this is really an inductive generalization (not the deductive if-then form from L2), it commits the same affirming-the-consequent move: writing tests being _associated with_ seniority doesn't mean writing tests _causes or defines_ seniority — there could be a common cause (experience) driving both independently.

## Failure modes

- **Treating "valid" as a compliment and "invalid" as an insult.** Calling an argument invalid is a narrow, technical claim about structure — it says nothing about whether the speaker is right, wrong, smart, or dishonest. The useful move is naming the specific structural gap ("this affirms the consequent — Q being true doesn't rule out other causes") rather than a vague "that's not logical."
- **Winning the structure, losing the premise fight.** A valid argument built on a false premise is still worth rejecting — but rejecting it requires attacking the premise, not the (perfectly valid) structure. Confusing which one is actually wrong wastes the conversation arguing past each other.
- **Assuming formal validity settles real decisions.** Most engineering arguments aren't strict deduction — they're inductive (generalizing from cases) or abductive (inference to the best explanation), where "valid" in the strict sense doesn't even apply. The truth-table checker above only works for genuinely deductive if-then claims; most "senior engineers do X" arguments need a different kind of scrutiny (sample size, selection bias, confounds) covered in `logic/correlation-causation`, not a validity check.
- **Using formal-logic vocabulary as a rhetorical weapon rather than a diagnostic tool.** Loudly declaring "that's a logical fallacy!" mid-discussion, without naming which one or why, is itself a persuasion tactic (an appeal to apparent rigor) rather than actual rigor — the discipline only pays off if you can name the specific structural gap and, ideally, a concrete counterexample.
