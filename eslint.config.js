import { defineConfig, globalIgnores } from "eslint/config";

import globals from "globals";
import js from "@eslint/js";

export default defineConfig([
  globalIgnores([
    "src/test",
  ]),
  { files: ["**/*.js"], languageOptions: { globals: globals.browser } },
  { files: ["**/*.js"], plugins: { js }, extends: ["js/recommended"] },

  {
    rules: {
    },
  },
]);

