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
  vite: {
    plugins: [tailwindcss()],
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
