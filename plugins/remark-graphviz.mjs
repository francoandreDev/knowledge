// Renders ```dot / ```graphviz fences to inline SVG at build time.
//
// Graphviz layout (rank/cluster aware) handles dependency graphs and
// directed graphs that Mermaid's dagre lays out poorly. Colors are rewritten
// to currentColor so the diagram follows the site's light/dark theme without
// a second render. Nothing runs in the browser.
import { Graphviz } from "@hpcc-js/wasm-graphviz";
import { fromHtml } from "hast-util-from-html";
import { visit } from "unist-util-visit";

let graphvizPromise;

// Node shapes get the current level accent (blue L1 / green L2 / amber L3)
// so graphs read as part of the page instead of black line art.
function colorNodes(svg) {
  return svg.replace(/<g id="node\d+" class="node">[\s\S]*?<\/g>/g, (g) =>
    g
      .replace(
        /(<(?:polygon|ellipse)[^>]*?) fill="[^"]*"/g,
        '$1 fill="var(--accent-soft-bg)"',
      )
      .replace(
        /(<(?:polygon|ellipse)[^>]*?) stroke="[^"]*"/g,
        '$1 stroke="var(--accent)"',
      ),
  );
}

function recolor(svg) {
  return (
    colorNodes(svg)
      .replace(/<\?xml[^>]*\?>/, "")
      .replace(/<!DOCTYPE[^>]*>/, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/(stroke|fill)="(black|#000000)"/g, '$1="currentColor"')
      // Graphviz emits <text> with no fill (renders black); follow the theme.
      .replace(/<text /g, '<text fill="currentColor" ')
      .replace(/fill="white"/g, 'fill="none"')
      .replace(
        /<polygon fill="none" stroke="transparent"/g,
        '<polygon fill="none" stroke="none"',
      )
  );
}

export default function remarkGraphviz() {
  return async (tree) => {
    const jobs = [];
    visit(tree, "code", (node, index, parent) => {
      if (node.lang !== "dot" && node.lang !== "graphviz") return;
      jobs.push({ node, index, parent });
    });
    if (jobs.length === 0) return;
    graphvizPromise ??= Graphviz.load();
    const graphviz = await graphvizPromise;
    for (const { node } of jobs) {
      const svg = recolor(graphviz.dot(node.value));
      const fragment = fromHtml(svg, { fragment: true });
      node.type = "paragraph";
      node.children = [];
      node.data = {
        hName: "div",
        hProperties: {
          className: ["graphviz", "not-prose"],
          role: "img",
        },
        hChildren: fragment.children,
      };
      delete node.lang;
      delete node.value;
    }
  };
}
