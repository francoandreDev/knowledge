// Client-side only. Turns a live DOM Range (or an existing element, for the
// "click an existing bold/code span" retroactive path) into a portable
// {quote, prefix, suffix} anchor, and turns that anchor back into a Range on
// a later visit — the same quote+context technique used by web annotation
// tools (Hypothesis, the W3C Web Annotation spec's TextQuoteSelector), which
// tolerates unrelated content elsewhere on the page shifting around it.

export interface Anchor {
  quote: string;
  prefix: string;
  suffix: string;
}

const CONTEXT_LEN = 32;

function offsetOf(root: Element, container: Node, offset: number): number {
  const pre = document.createRange();
  pre.selectNodeContents(root);
  pre.setEnd(container, offset);
  return pre.toString().length;
}

export function anchorFromRange(range: Range, root: Element): Anchor {
  const quote = range.toString();
  const fullText = root.textContent ?? "";
  const startOffset = offsetOf(root, range.startContainer, range.startOffset);
  const prefix = fullText.slice(
    Math.max(0, startOffset - CONTEXT_LEN),
    startOffset,
  );
  const suffix = fullText.slice(
    startOffset + quote.length,
    startOffset + quote.length + CONTEXT_LEN,
  );
  return { quote, prefix, suffix };
}

/** Anchor for a whole existing element (the retroactive bold/code case) — no user selection involved, so the anchor is derived from the element's own text plus what surrounds it. */
export function anchorFromElement(el: Element, root: Element): Anchor {
  const range = document.createRange();
  range.selectNodeContents(el);
  return anchorFromRange(range, root);
}

/**
 * Re-finds the DOM Range matching a saved anchor. Prefers an exact
 * prefix+quote+suffix match; falls back to a bare quote match if the
 * surrounding text drifted (e.g. the unit was lightly edited) — ambiguous
 * when the quote repeats, but recovering an approximate spot beats losing
 * the annotation outright.
 */
export function resolveAnchor(root: Element, anchor: Anchor): Range | null {
  const fullText = root.textContent ?? "";
  const combined = anchor.prefix + anchor.quote + anchor.suffix;
  const combinedIndex = fullText.indexOf(combined);
  const quoteStart =
    combinedIndex !== -1
      ? combinedIndex + anchor.prefix.length
      : fullText.indexOf(anchor.quote);
  if (quoteStart === -1) return null;
  const quoteEnd = quoteStart + anchor.quote.length;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Text | null;
  let pos = 0;
  let startNode: Text | null = null;
  let startNodeOffset = 0;
  let endNode: Text | null = null;
  let endNodeOffset = 0;
  while ((node = walker.nextNode() as Text | null)) {
    const len = node.data.length;
    if (startNode === null && pos + len > quoteStart) {
      startNode = node;
      startNodeOffset = quoteStart - pos;
    }
    if (endNode === null && pos + len >= quoteEnd) {
      endNode = node;
      endNodeOffset = quoteEnd - pos;
      break;
    }
    pos += len;
  }
  if (!startNode || !endNode) return null;

  const range = document.createRange();
  range.setStart(startNode, startNodeOffset);
  range.setEnd(endNode, endNodeOffset);
  return range;
}

/** Wraps a Range with `el`, tolerating the (rare) DOM shapes where a plain surroundContents() throws. */
export function wrapRange(range: Range, el: HTMLElement): boolean {
  try {
    range.surroundContents(el);
    return true;
  } catch {
    return false;
  }
}
