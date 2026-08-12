// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs["flat/recommended"],
  eslintConfigPrettier,
  {
    ignores: ["dist/**", ".astro/**", "node_modules/**"],
  },
  {
    files: ["scripts/**/*.mjs", "*.config.mjs"],
    languageOptions: {
      globals: { ...globals.node, Bun: "readonly" },
    },
  },
  {
    rules: {
      // Content-collection ids are dynamic; unused-var noise isn't worth it
      // in small glue scripts.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
);
