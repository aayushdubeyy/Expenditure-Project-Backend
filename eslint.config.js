import eslintPluginTs from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.ts", "**/*.js"],
    ignores: [
      "node_modules/**",
      "dist/**",
      "prisma/**" ,
      "generated/**"
    ],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: {
      "@typescript-eslint": eslintPluginTs,
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": ["warn", { allow: ["error"] }],
      eqeqeq: "error",
      curly: "error",
      "no-multiple-empty-lines": ["error", { max: 1 }],
      semi: ["error", "always"],
      quotes: ["error", "double"],
    },  
  },
];
