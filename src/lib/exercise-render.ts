// Shared client-side rendering for self-grading quiz/code exercises —
// extracted so ExercisePanel (legacy flat pools), PracticeCheck (inline
// practice-tier chips) and DomainCheck (the exam-tier "Domain check"
// section) render the exact same quiz/code UI instead of three copies of
// it. See CLAUDE.md "Exercises" for the three-tier model this supports.

import { mountWhiteboardTrigger } from "./whiteboard";
import { mountLearnMoreTrigger } from "./learn-more";

export type QuizVariant = {
  type: "quiz";
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  reference?: string;
  learnMore?: string;
  chipLabel?: string;
};
export type CodeVariant = {
  type: "code";
  id: string;
  prompt: string;
  starterCode: string;
  tests: { description: string; expr: string }[];
  solution: string;
  explanation: string;
  reference?: string;
  learnMore?: string;
  chipLabel?: string;
};
export type Variant = QuizVariant | CodeVariant;

const WORKER_SOURCE = `
    self.onmessage = (e) => {
      const { code, tests } = e.data;

      function expect(actual) {
        return {
          toBe(expected) {
            if (!Object.is(actual, expected)) {
              throw new Error("Expected " + JSON.stringify(actual) + " to be " + JSON.stringify(expected));
            }
          },
          toEqual(expected) {
            const a = JSON.stringify(actual);
            const b = JSON.stringify(expected);
            if (a !== b) throw new Error("Expected " + a + " to equal " + b);
          },
          toBeTruthy() {
            if (!actual) throw new Error("Expected " + JSON.stringify(actual) + " to be truthy");
          },
          toThrow() {
            if (typeof actual !== "function") {
              throw new Error("expect(...).toThrow() needs a function");
            }
            let threw = false;
            try { actual(); } catch { threw = true; }
            if (!threw) throw new Error("Expected function to throw, but it didn't");
          },
        };
      }

      const results = [];
      for (const t of tests) {
        try {
          eval(code + "\\n" + t.expr);
          results.push({ description: t.description, passed: true });
        } catch (err) {
          results.push({ description: t.description, passed: false, error: String((err && err.message) || err) });
        }
      }
      self.postMessage({ results });
    };
  `;

export function runInWorker(
  code: string,
  tests: { description: string; expr: string }[],
): Promise<{ description: string; passed: boolean; error?: string }[]> {
  return new Promise((resolve) => {
    const blob = new Blob([WORKER_SOURCE], {
      type: "application/javascript",
    });
    const worker = new Worker(URL.createObjectURL(blob));

    const timeout = setTimeout(() => {
      worker.terminate();
      resolve(
        tests.map((t) => ({
          description: t.description,
          passed: false,
          error: "Timed out after 3s — possible infinite loop.",
        })),
      );
    }, 3000);

    worker.onmessage = (e) => {
      clearTimeout(timeout);
      worker.terminate();
      resolve(e.data.results);
    };
    worker.onerror = (e) => {
      clearTimeout(timeout);
      worker.terminate();
      resolve(
        tests.map((t) => ({
          description: t.description,
          passed: false,
          error: e.message,
        })),
      );
    };

    worker.postMessage({ code, tests });
  });
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// The whiteboard's reference panel is the question itself — the
// choices/starter code are already visible on the page right next to the
// drawer — plus, when set, the pool's own `reference`: a compact visual and
// one-line theory statement connecting a wrong answer back to the concept
// it's testing. The question is built via textContent (safely HTML-escaped);
// `reference` is trusted, author-written HTML from exercises.json, same as
// `Scenario`'s `facts` slot.
export function buildReferenceHTML(
  promptText: string,
  reference?: string,
): string {
  const wrap = document.createElement("div");
  const label = el(
    "p",
    "text-xs font-semibold uppercase tracking-wide text-slate-400",
    "Question",
  );
  const p = document.createElement("p");
  p.textContent = promptText;
  wrap.append(label, p);
  if (reference) {
    const referenceWrap = document.createElement("div");
    referenceWrap.className =
      "mt-3 border-t border-slate-200 pt-3 dark:border-slate-700";
    referenceWrap.innerHTML = reference;
    wrap.append(referenceWrap);
  }
  return wrap.innerHTML;
}

function exerciseToolsRow(
  key: string,
  referenceHTML: string,
  learnMore: string | undefined,
): HTMLElement {
  const row = el("div", "mt-2 flex justify-end gap-2");
  mountWhiteboardTrigger(row, {
    storageKey: `whiteboard:${location.pathname}:${key}`,
    referenceHTML,
    title: "Exercise reference",
  });
  if (learnMore) {
    mountLearnMoreTrigger(row, {
      title: "Learn more",
      contentHTML: learnMore,
    });
  }
  return row;
}

export interface RenderOptions {
  /** Practice-tier chips stay lightweight — no whiteboard/learn-more row. */
  skipTools?: boolean;
}

export function renderQuiz(
  container: HTMLElement,
  variant: QuizVariant,
  toolsKey: string,
  reference: string | undefined,
  learnMore: string | undefined,
  onGraded: (passed: boolean) => void,
  options: RenderOptions = {},
) {
  const prompt = el(
    "p",
    "text-base text-slate-800 dark:text-slate-200",
    variant.prompt,
  );
  const wrap = el("div", "mt-3 space-y-2");

  const UNSELECTED_LABEL_CLASS =
    "flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600";
  // Native radio dots are easy to miss at a glance, especially scanning
  // several choices quickly — the label itself now carries a visible
  // border + tinted background + bold text while its radio is checked, on
  // top of (not instead of) the native dot. The tint reads as "selected in
  // this level's accent" the same way Scenario/Checkpoint boxes already do.
  const SELECTED_LABEL_CLASS =
    "flex items-center gap-2.5 rounded-lg border-2 px-3 py-2 text-sm font-medium transition";

  const radios: HTMLInputElement[] = [];
  variant.choices.forEach((choice, i) => {
    const label = el("label", UNSELECTED_LABEL_CLASS);
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = `quiz-${variant.id}`;
    radio.value = String(i);
    radio.className = "h-4 w-4 shrink-0 accent-[var(--accent)]";
    radio.addEventListener("change", () => {
      radios.forEach((r) => {
        const l = r.closest("label")!;
        l.className = r.checked ? SELECTED_LABEL_CLASS : UNSELECTED_LABEL_CLASS;
        l.style.borderColor = r.checked ? "var(--accent)" : "";
        l.style.background = r.checked ? "var(--accent-soft-bg)" : "";
        l.style.color = r.checked ? "var(--accent-text)" : "";
      });
    });
    radios.push(radio);
    label.append(radio, document.createTextNode(choice));
    wrap.append(label);
  });

  const feedback = el("p", "hidden text-sm font-medium");
  const explanation = el(
    "p",
    "hidden mt-1 text-sm text-slate-500 dark:text-slate-400",
    variant.explanation,
  );
  const checkButton = el(
    "button",
    "rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white",
    "Check answer",
  );
  checkButton.type = "button";

  // One attempt per view — once graded, the radios and button lock. Without
  // this, nothing stops clicking through choices one at a time until one
  // happens to pass, or re-selecting the now-visible correct answer after
  // reading the explanation — either way "passed" would no longer mean the
  // learner actually knew it going in.
  checkButton.addEventListener("click", () => {
    const selected = radios.find((r) => r.checked);
    if (!selected) {
      feedback.textContent = "Pick an answer first.";
      feedback.className = "text-sm font-medium text-amber-600";
      feedback.classList.remove("hidden");
      return;
    }
    const passed = Number(selected.value) === variant.correctIndex;
    feedback.textContent = passed ? "Correct" : "Not quite";
    feedback.className = passed
      ? "text-sm font-medium text-emerald-600 animate-pop"
      : "text-sm font-medium text-red-600 animate-shake";
    feedback.classList.remove("hidden");
    explanation.classList.remove("hidden");
    explanation.classList.add("animate-fade-slide-in");

    radios.forEach((radio, i) => {
      radio.disabled = true;
      const label = radio.closest("label")!;
      label.style.borderColor = "";
      label.style.background = "";
      label.style.color = "";
      if (i === variant.correctIndex) {
        label.className =
          "flex items-center gap-2.5 rounded-lg border-2 border-emerald-400 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 dark:border-emerald-600 dark:bg-emerald-950 dark:text-emerald-300";
      } else if (radio === selected) {
        label.className =
          "flex items-center gap-2.5 rounded-lg border-2 border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 line-through decoration-red-400 dark:border-red-700 dark:bg-red-950 dark:text-red-300";
      } else {
        label.className =
          "flex items-center gap-2.5 rounded-lg border border-transparent px-3 py-2 text-sm text-slate-400 dark:text-slate-600";
      }
    });
    checkButton.disabled = true;

    onGraded(passed);
    document.dispatchEvent(new CustomEvent("exercise:graded"));
  });

  wrap.append(checkButton, feedback, explanation);
  container.append(prompt);
  if (!options.skipTools) {
    container.append(
      exerciseToolsRow(
        toolsKey,
        buildReferenceHTML(variant.prompt, reference),
        learnMore,
      ),
    );
  }
  container.append(wrap);
}

export function renderCode(
  container: HTMLElement,
  variant: CodeVariant,
  toolsKey: string,
  reference: string | undefined,
  learnMore: string | undefined,
  onGraded: (passed: boolean) => void,
  options: RenderOptions = {},
) {
  const prompt = el(
    "p",
    "text-base text-slate-800 dark:text-slate-200",
    variant.prompt,
  );
  const wrap = el("div", "mt-3 space-y-2");

  const textarea = document.createElement("textarea");
  textarea.spellcheck = false;
  textarea.rows = 6;
  textarea.value = variant.starterCode;
  textarea.className =
    "w-full rounded-md border border-slate-300 bg-slate-50 p-3 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

  const runButton = el(
    "button",
    "rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white",
    "Run tests",
  );
  runButton.type = "button";

  const resultsList = el("ul", "space-y-1 text-sm");
  const solutionWrap = el("div", "hidden mt-3 space-y-1");
  const solutionLabel = el(
    "p",
    "text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400",
    "Solution",
  );
  const solutionCode = el(
    "pre",
    "overflow-x-auto rounded-md bg-slate-900 p-3 text-sm text-slate-100",
  );
  const solutionCodeInner = document.createElement("code");
  solutionCodeInner.textContent = variant.solution;
  solutionCode.append(solutionCodeInner);
  const solutionExplanation = el(
    "p",
    "text-sm text-slate-500 dark:text-slate-400",
    variant.explanation,
  );
  solutionWrap.append(solutionLabel, solutionCode, solutionExplanation);

  runButton.addEventListener("click", async () => {
    runButton.disabled = true;
    runButton.textContent = "Running…";
    const results = await runInWorker(textarea.value, variant.tests);
    runButton.disabled = false;
    runButton.textContent = "Run tests";

    resultsList.innerHTML = "";
    resultsList.classList.add("animate-fade-slide-in");
    let allPassed = true;
    for (const r of results) {
      if (!r.passed) allPassed = false;
      const li = el(
        "li",
        r.passed ? "text-emerald-600" : "text-red-600",
        r.passed
          ? `✓ ${r.description}`
          : `✗ ${r.description}${r.error ? ` — ${r.error}` : ""}`,
      );
      resultsList.append(li);
    }
    resultsList.classList.add(allPassed ? "animate-pop" : "animate-shake");
    solutionWrap.classList.remove("hidden");
    solutionWrap.classList.add("animate-fade-slide-in");
    onGraded(allPassed);
    document.dispatchEvent(new CustomEvent("exercise:graded"));
  });

  wrap.append(textarea, runButton, resultsList, solutionWrap);
  container.append(prompt);
  if (!options.skipTools) {
    container.append(
      exerciseToolsRow(
        toolsKey,
        buildReferenceHTML(variant.prompt, reference),
        learnMore,
      ),
    );
  }
  container.append(wrap);
}
