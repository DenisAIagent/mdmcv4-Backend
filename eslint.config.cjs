const globals = require("globals");
const js = require("@eslint/js");

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module", // Keep sourceType as module for linting ES module files if any, but the config itself is CJS
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Add any specific rules here if needed, for now, just recommended
      "no-unused-vars": "warn",
      "no-console": "off",
    },
  },
];

