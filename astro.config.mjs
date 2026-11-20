// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import icon from "astro-icon";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGraphviz from "./plugins/remark-graphviz.mjs";

// https://astro.build/config
export default defineConfig({
  // /tracks was a second copy of the worlds already on the home page and the
  // roadmap; the nav slot now belongs to /study.
  redirects: {
    "/tracks": { status: 301, destination: "/study" },
  },

  vite: {
    plugins: [tailwindcss()],
    build: {
      // the ELK layout engine (~1.9 MB, mermaid) and other viz libs are large and load
      // client-side on demand; the default 500 kB limit only produces noise.
      chunkSizeWarningLimit: 2100,
    },
  },

  markdown: {
    shikiConfig: {
      theme: "dracula",
    },
    // Single-dollar math is off: content is full of prices ("$340", "$80 or
    // $10") that would otherwise be parsed as inline formulas. Write inline
    // math as $$x$$ and block math as a ```math fence or $$ on its own lines.
    remarkPlugins: [
      [remarkMath, { singleDollarTextMath: false }],
      remarkGraphviz,
    ],
    rehypePlugins: [rehypeKatex],
  },

  integrations: [mdx(), icon()],
});
