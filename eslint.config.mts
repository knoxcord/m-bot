import js from "@eslint/js";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";
import { configs as tseslintConfigs, parser as tseslintParser } from "typescript-eslint";
import { importX } from 'eslint-plugin-import-x';

export default defineConfig([
globalIgnores([
  "build/",
  "node_modules/",
]),
js.configs.recommended,
...tseslintConfigs.recommended,
importX.flatConfigs.recommended,
importX.flatConfigs.typescript,
{
  files: ["src/**/*.{js,mjs,cjs,ts,mts,cts}"],
  languageOptions: {
    parser: tseslintParser,
    parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
    globals: globals.node,
  },
  settings: {
    'import-x/resolver': {
      typescript: true
    }
  },
  rules: {
    'import-x/no-unresolved': "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "args": "all",
        "argsIgnorePattern": "^_",
        "caughtErrors": "all",
        "caughtErrorsIgnorePattern": "^_",
        "destructuredArrayIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "ignoreRestSiblings": true
      }
    ],
  },
}]);
