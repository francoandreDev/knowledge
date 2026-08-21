// Freehand scratch space attached to a problem callout or an exercise —
// client-side only (canvas + localStorage), no backend. One drawer instance
// per trigger; drawer/backdrop are built lazily on first open and appended
// to document.body so they're never clipped by an ancestor's overflow.
//
// Ink is drawn on a transparent canvas; the "paper" colour (white board vs.
// green chalkboard) is a separate CSS background behind it. That's what
// lets the board style toggle without losing or repainting existing
// strokes, and lets the eraser use real destination-out erasing instead of
// a same-colour-as-background hack.
//
// Drawings are per-learner data, so they're persisted via the per-profile
// `pStorage` wrapper — not raw `localStorage` — while the board-style
// preference (white/green) is a device-level UI choice and intentionally
// stays on raw `localStorage`, shared across every profile.

import { pStorage } from "./profile";

interface WhiteboardOptions {
  /** pStorage key this drawing persists under. Must be unique per block. */
  storageKey: string;
  /** Trusted, already-authored HTML — a distilled, structured recap of the
   * block's key facts (not a duplicate of what's already on the page). */
  referenceHTML: string;
  /** Drawer header title. */
  title: string;
}

type BoardStyle = "white" | "green";

const BOARD_STYLE_KEY = "whiteboard:board-style";

const BOARD_STYLES: Record<
  BoardStyle,
  { background: string; colors: string[] }
> = {
  white: {
    background: "#ffffff",
    colors: ["#111827", "#dc2626", "#2563eb", "#15803d"],
  },
  green: {
    background: "#1b4332",
    colors: ["#ffffff", "#fde68a", "#f9a8d4", "#93c5fd"],
  },
};

const PEN_WIDTH = 2.5;
const ERASER_WIDTH = 24;

function getBoardStyle(): BoardStyle {
  return localStorage.getItem(BOARD_STYLE_KEY) === "green" ? "green" : "white";
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Board styles pair colors by position (white palette[i] <-> green
// palette[i]) so each has a contrast-appropriate counterpart. Switching
// board style remaps every already-drawn pixel to its counterpart's color
// instead of leaving strokes in whatever color they were drawn with —
// otherwise a dark stroke drawn on white becomes nearly invisible on green,
// and vice versa.
function recolorCanvas(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  fromPalette: string[],
  toPalette: string[],
) {
  const fromRgb = fromPalette.map(hexToRgb);
  const toRgb = toPalette.map(hexToRgb);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let p = 0; p < data.length; p += 4) {
    if (data[p + 3] === 0) continue; // fully transparent (erased) — skip
    let bestIndex = 0;
    let bestDistance = Infinity;
    for (let i = 0; i < fromRgb.length; i++) {
      const [r, g, b] = fromRgb[i];
      const distance =
        (data[p] - r) ** 2 + (data[p + 1] - g) ** 2 + (data[p + 2] - b) ** 2;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = i;
      }
    }
    const [nr, ng, nb] = toRgb[bestIndex];
    data[p] = nr;
    data[p + 1] = ng;
    data[p + 2] = nb;
  }

  ctx.putImageData(imageData, 0, 0);
}

export function mountWhiteboardTrigger(
  triggerContainer: HTMLElement,
  opts: WhiteboardOptions,
): void {
  const button = document.createElement("button");
  button.type = "button";
  button.className =
    "inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-500";
  button.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg><span>Whiteboard</span>';

  let drawer: { open: () => void } | null = null;

  button.addEventListener("click", () => {
    if (!drawer) drawer = buildDrawer(opts);
    drawer.open();
  });

  triggerContainer.append(button);
}

function buildDrawer(opts: WhiteboardOptions): { open: () => void } {
  const backdrop = document.createElement("div");
  backdrop.className =
    "fixed inset-0 z-40 bg-black/40 opacity-0 pointer-events-none transition-opacity duration-200";

  const drawer = document.createElement("div");
  drawer.className =
    "fixed right-0 top-0 z-50 flex h-full w-[min(90vw,420px)] translate-x-full flex-col bg-white shadow-xl transition-transform duration-200 dark:bg-slate-900";

  const header = document.createElement("div");
  header.className =
    "flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700";
  const heading = document.createElement("h4");
  heading.className =
    "text-sm font-semibold text-slate-800 dark:text-slate-100";
  heading.textContent = opts.title;
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Close whiteboard");
  closeButton.className =
    "rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800";
  closeButton.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  header.append(heading, closeButton);

  const reference = document.createElement("div");
  reference.className =
    "prose prose-slate prose-sm max-h-[30%] max-w-none overflow-y-auto border-b border-slate-200 bg-slate-50 px-4 py-3 dark:prose-invert dark:border-slate-700 dark:bg-slate-950/40";
  reference.innerHTML = opts.referenceHTML;

  const toolbar = document.createElement("div");
  toolbar.className =
    "flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2 dark:border-slate-700";

  const swatchRow = document.createElement("div");
  swatchRow.className = "flex items-center gap-1.5";

  const textButton = toolButton("Text", false);
  const eraserButton = toolButton("Eraser", false);
  const clearButton = toolButton("Clear", false);
  const boardToggle = document.createElement("div");
  boardToggle.className = "ml-auto flex items-center gap-1.5";
  const whiteBoardBtn = toolButton("White", true);
  const greenBoardBtn = toolButton("Green", false);
  boardToggle.append(whiteBoardBtn, greenBoardBtn);

  toolbar.append(swatchRow, textButton, eraserButton, clearButton, boardToggle);

  const canvasWrap = document.createElement("div");
  canvasWrap.className = "relative flex-1 overflow-hidden";
  const canvas = document.createElement("canvas");
  canvas.className = "block h-full w-full touch-none";
  canvas.style.touchAction = "none";
  canvasWrap.append(canvas);

  drawer.append(header, reference, toolbar, canvasWrap);

  type Tool = "pen" | "eraser" | "text";

  let sized = false;
  let tool: Tool = "pen";
  let currentColor = "";
  let currentStyle: BoardStyle = getBoardStyle();
  let activeInput: HTMLInputElement | null = null;

  function setTool(next: Tool) {
    tool = next;
    eraserButton.dataset.active = String(tool === "eraser");
    textButton.dataset.active = String(tool === "text");
    paintSwatches();
  }

  function paintSwatches() {
    swatchRow.innerHTML = "";
    const { colors } = BOARD_STYLES[currentStyle];
    colors.forEach((color, i) => {
      const swatch = document.createElement("button");
      swatch.type = "button";
      swatch.setAttribute("aria-label", `Color ${i + 1}`);
      swatch.dataset.active = String(tool === "pen" && currentColor === color);
      swatch.className =
        "h-6 w-6 rounded-full border-2 border-transparent data-[active=true]:border-sky-500";
      swatch.style.backgroundColor = color;
      swatch.addEventListener("click", () => {
        currentColor = color;
        setTool("pen");
      });
      swatchRow.append(swatch);
    });
  }

  function applyBoardStyle(style: BoardStyle, persist: boolean) {
    const previousStyle = currentStyle;
    const previousPalette = BOARD_STYLES[previousStyle].colors;
    const nextPalette = BOARD_STYLES[style].colors;

    if (sized && style !== previousStyle) {
      const ctx = canvas.getContext("2d")!;
      recolorCanvas(ctx, canvas, previousPalette, nextPalette);
      save();
    }

    const colorIndex = previousPalette.indexOf(currentColor);
    currentColor = nextPalette[colorIndex >= 0 ? colorIndex : 0];

    currentStyle = style;
    canvasWrap.style.backgroundColor = BOARD_STYLES[style].background;
    whiteBoardBtn.dataset.active = String(style === "white");
    greenBoardBtn.dataset.active = String(style === "green");
    paintSwatches();
    if (persist) localStorage.setItem(BOARD_STYLE_KEY, style);
  }

  whiteBoardBtn.addEventListener("click", () => applyBoardStyle("white", true));
  greenBoardBtn.addEventListener("click", () => applyBoardStyle("green", true));

  applyBoardStyle(currentStyle, false);

  function clearCanvas() {
    const ctx = canvas.getContext("2d")!;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  function sizeCanvas() {
    const rect = canvasWrap.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const previous = canvas.width > 0 ? canvas.toDataURL("image/png") : null;

    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const saved = pStorage.getItem(opts.storageKey) || previous;
    if (saved) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = saved;
    }
  }

  function save() {
    pStorage.setItem(opts.storageKey, canvas.toDataURL("image/png"));
  }

  eraserButton.addEventListener("click", () => setTool("eraser"));
  textButton.addEventListener("click", () => setTool("text"));
  clearButton.addEventListener("click", () => {
    commitActiveInput();
    clearCanvas();
    pStorage.removeItem(opts.storageKey);
  });

  function commitActiveInput() {
    activeInput?.blur();
  }

  function startTextInput(x: number, y: number) {
    commitActiveInput();

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Type, then Enter";
    input.className =
      "absolute z-10 rounded border border-slate-400 bg-white/95 px-1.5 py-0.5 text-sm text-slate-900 shadow-sm outline-none dark:border-slate-500 dark:bg-slate-800/95 dark:text-slate-100";
    input.style.left = `${x}px`;
    input.style.top = `${Math.max(0, y - 12)}px`;
    input.style.minWidth = "100px";

    let committed = false;
    const commit = () => {
      if (committed) return;
      committed = true;
      const value = input.value.trim();
      if (value) {
        const ctx = canvas.getContext("2d")!;
        ctx.font = "16px system-ui, sans-serif";
        ctx.fillStyle = currentColor;
        ctx.textBaseline = "top";
        ctx.fillText(value, x, y);
        save();
      }
      input.remove();
      if (activeInput === input) activeInput = null;
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commit();
      } else if (e.key === "Escape") {
        input.value = "";
        commit();
      }
    });
    input.addEventListener("blur", commit);

    activeInput = input;
    canvasWrap.append(input);
    input.focus();
  }

  let drawing = false;
  let lastX = 0;
  let lastY = 0;

  function point(e: PointerEvent): [number, number] {
    const rect = canvas.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  }

  canvas.addEventListener("pointerdown", (e) => {
    const [x, y] = point(e);
    if (tool === "text") {
      startTextInput(x, y);
      return;
    }
    canvas.setPointerCapture(e.pointerId);
    drawing = true;
    [lastX, lastY] = [x, y];
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    const ctx = canvas.getContext("2d")!;
    const [x, y] = point(e);
    const erasing = tool === "eraser";
    ctx.globalCompositeOperation = erasing ? "destination-out" : "source-over";
    ctx.strokeStyle = erasing ? "rgba(0,0,0,1)" : currentColor;
    ctx.lineWidth = erasing ? ERASER_WIDTH : PEN_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    [lastX, lastY] = [x, y];
  });

  function endStroke(e: PointerEvent) {
    if (!drawing) return;
    drawing = false;
    canvas.releasePointerCapture(e.pointerId);
    save();
  }

  canvas.addEventListener("pointerup", endStroke);
  canvas.addEventListener("pointercancel", endStroke);

  function close() {
    backdrop.classList.add("opacity-0", "pointer-events-none");
    drawer.classList.add("translate-x-full");
  }

  closeButton.addEventListener("click", close);
  backdrop.addEventListener("click", close);

  function open() {
    backdrop.classList.remove("opacity-0", "pointer-events-none");
    drawer.classList.remove("translate-x-full");
    if (!sized) {
      // Drawer is display:block but width:0-ish until the transition
      // settles; measuring on the next frame gets the real layout size.
      requestAnimationFrame(() => {
        sizeCanvas();
        sized = true;
      });
    }
  }

  document.body.append(backdrop, drawer);
  return { open };
}

function toolButton(label: string, active: boolean): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.dataset.active = String(active);
  button.className =
    "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors border-slate-300 text-slate-600 hover:border-slate-400 data-[active=true]:border-sky-500 data-[active=true]:bg-sky-50 data-[active=true]:text-sky-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-500 dark:data-[active=true]:border-sky-500 dark:data-[active=true]:bg-sky-950 dark:data-[active=true]:text-sky-400";
  return button;
}
