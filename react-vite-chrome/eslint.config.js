import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import airbnb from "eslint-config-airbnb";

export default [
  { ignores: ["dist", "build"] }, // Ignore output folders
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: { ...globals.browser, ...globals.webextensions }, // Chrome extension APIs
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    settings: { react: { version: "detect" } }, // Automatically detect React version
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // Airbnb Rules
      ...airbnb.rules,
      // React Rules
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      // ESLint Recommended
      ...js.configs.recommended.rules,
      // Custom Rules
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }], // Unused vars with exception
      "no-undef": "error", // Error on undeclared variables
      "react/jsx-props-no-spreading": "off", // Allow prop spreading
      "react/react-in-jsx-scope": "off", // Not needed for React 17+
      "react/jsx-no-target-blank": ["error", { allowReferrer: true }],
      "react-hooks/rules-of-hooks": "error", // Checks hooks rules
      "react-hooks/exhaustive-deps": "warn", // Checks dependencies for useEffect
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
  {
    // Special Configuration for Chrome Extension Service Workers/Background Scripts
    files: ["**/background.js", "**/service-worker.js"],
    languageOptions: {
      globals: { ...globals.webextensions },
    },
    rules: {
      "no-console": "off", // Allow console for debugging
      "no-restricted-globals": ["error", "event", "fdescribe"], // Avoid common pitfalls
    },
  },
];
