import nextPluginImport from "@next/eslint-plugin-next";
import tsPluginImport from "@typescript-eslint/eslint-plugin";
import tsParserImport from "@typescript-eslint/parser";

const nextPlugin = nextPluginImport.default ?? nextPluginImport;
const tsPlugin = tsPluginImport.default ?? tsPluginImport;
const tsParser = tsParserImport.default ?? tsParserImport;

export default [
  {
    ignores: [
      "assets/**",
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  nextPlugin.configs["core-web-vitals"],
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
    languageOptions: {
      parser: tsParser,
      sourceType: "module",
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...(tsPlugin.configs?.recommended?.rules ?? {}),
      "@typescript-eslint/no-unused-vars": 1,
      "@typescript-eslint/no-unused-expressions": 1,
    },
  },
];
