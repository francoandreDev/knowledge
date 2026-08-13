// A read-only "learn more" modal — deep, dedicated explanatory content for
// a specific exercise pool, distinct from the whiteboard's scratch space.
// No canvas, no persistence: open, read, close. Centered (not a side
// drawer) so it reads as "stop and read this" rather than "work alongside
// this."

interface LearnMoreOptions {
  /** Modal header title. */
  title: string;
  /** Trusted, already-authored HTML — the actual explanation. */
  contentHTML: string;
}

export function mountLearnMoreTrigger(
  triggerContainer: HTMLElement,
  opts: LearnMoreOptions,
): void {
  const button = document.createElement("button");
  button.type = "button";
  button.className =
    "inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-500";
  button.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg><span>Learn more</span>';

  let modal: { open: () => void } | null = null;

  button.addEventListener("click", () => {
    if (!modal) modal = buildModal(opts);
    modal.open();
  });

  triggerContainer.append(button);
}

function buildModal(opts: LearnMoreOptions): { open: () => void } {
  const backdrop = document.createElement("div");
  backdrop.className =
    "fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4 opacity-0 pointer-events-none transition-opacity duration-200";

  const card = document.createElement("div");
  card.className =
    "max-h-[80vh] w-full max-w-md scale-95 overflow-hidden rounded-lg bg-white shadow-xl transition-transform duration-200 dark:bg-slate-900";

  const header = document.createElement("div");
  header.className =
    "flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700";
  const heading = document.createElement("h4");
  heading.className =
    "text-sm font-semibold text-slate-800 dark:text-slate-100";
  heading.textContent = opts.title;
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Close");
  closeButton.className =
    "rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800";
  closeButton.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  header.append(heading, closeButton);

  const body = document.createElement("div");
  body.className =
    "prose prose-slate prose-sm max-h-[calc(80vh-52px)] max-w-none overflow-y-auto px-4 py-3 dark:prose-invert";
  body.innerHTML = opts.contentHTML;

  card.append(header, body);
  backdrop.append(card);

  function close() {
    backdrop.classList.add("opacity-0", "pointer-events-none");
    card.classList.add("scale-95");
  }

  function open() {
    backdrop.classList.remove("opacity-0", "pointer-events-none");
    card.classList.remove("scale-95");
  }

  closeButton.addEventListener("click", close);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  document.body.append(backdrop);
  return { open };
}
