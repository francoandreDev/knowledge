# Project instructions — systems-mastery

This file governs how content is generated and evolved in this project across sessions. Follow it exactly.

## What this project is

A self-study reference the user is building to grow from junior to a solid staff-level engineer. It covers ten tracks: `web/`, `systems/`, `git-teamwork/`, `business-communication/`, `logic/`, `security/`, `infra-delivery/`, `career-craft/`, `product-domain/`, `corporate-politics/`. See `docs/ARCHITECTURE.md` for the full rationale and `ROADMAP.md` for the topic list.

## Non-negotiable generation rules

1. **All content is written in English.** No exceptions, regardless of the language the session is conducted in.
2. **One unit per session.** A "unit" is a single problem→solution item from `ROADMAP.md`. Do not generate multiple units in one session unless the user explicitly asks to batch.
3. **No explicit level labels.** Never write "junior", "mid", "senior", or "staff" as a tag, folder name, or heading inside a unit. The progression toward staff-level is expressed through the growing complexity and stakes of the problems themselves — not through a label. It's fine to reference these words narratively if genuinely relevant (e.g. quoting a real title in an example), but never as a classification device.
4. **Every unit has exactly three levels, no more, no less:**
   - `L1-summary.md` — a tight outline of the topic. Bullet points, key terms, the shape of the problem. Someone should be able to skim this in 2 minutes and know what the unit covers.
   - `L2-concept.md` — the idea itself: pseudocode, a diagram (ASCII or Mermaid), architecture sketch, semantics, the "why" and the "how it fits together". No production code yet — this is about the model in your head, not the implementation.
   - `L3-deep-dive.md` (or `L3-deep-dive/` folder, see rule 5) — extensive theory with real, runnable code examples. This is the substantial one. Trade-offs, edge cases, failure modes, at least one worked example end-to-end.
5. **L3 may span multiple sessions.** If a topic is large, split `L3-deep-dive/` into a folder with `part-1-<slug>.md`, `part-2-<slug>.md`, etc., plus a short `00-index.md` listing the parts and their status (done / in progress / planned). Never leave a part half-written across a session boundary — finish the part you're on, then stop.
6. **Update `PROGRESS.md` at the end of every session** that produces or completes content: date, unit touched, what level(s) were written, and what's next.
7. **Update `ROADMAP.md`** whenever a unit is added, reordered, split, or reworded — the roadmap must always reflect reality, not the original plan.
8. **Don't pad.** If a unit's concept is simple, L2 can be short. Depth should track the actual complexity of the problem, not a page-count target.
9. **Every unit stands on real code**, not toy hand-waving — L3 examples should be the kind of code you'd actually defend in a review, with realistic naming and structure (language choice is free per-topic; pick whatever best illustrates the concept, and say why if it's not obvious).
10. **Before starting a new unit, ask the user which track/unit to tackle** unless they've already named it — do not assume the next item in `ROADMAP.md` is automatically next; track order is decided per session (see `docs/ARCHITECTURE.md`).

## File/folder naming

```
<track>/NN-<slug>/
  L1-summary.md
  L2-concept.md
  L3-deep-dive.md              # or:
  L3-deep-dive/
    00-index.md
    part-1-<slug>.md
    part-2-<slug>.md
```
`NN` is a two-digit sequence number reflecting the unit's position in that track's complexity ordering (per `ROADMAP.md`), not a session number.

## Session workflow

1. User picks (or confirms) a track + unit.
2. Confirm scope for that unit in one or two sentences before writing (especially if it's ambiguous or large) — no need for a full approval cycle each time, just a sanity check.
3. Write the level(s) in scope for the session.
4. Update `PROGRESS.md` and `ROADMAP.md` status markers.
5. Suggest — don't decide — what a sensible next unit could be, across any track.
