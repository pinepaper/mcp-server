// ESLint flat config.
//
// There was no config file here AT ALL — not a legacy `.eslintrc` awaiting
// migration, nothing. The `lint` script has existed alongside eslint and the
// typescript-eslint plugin in devDependencies while failing on every invocation
// with "couldn't find an eslint.config file", exit 2. So this repo has never had
// a lint gate, and nobody noticed because a script that always fails looks the
// same as one nobody runs.
//
// Deliberately NOT type-aware (`projectService`). Type-aware linting needs a
// full program per run and turns a two-second check into a slow one; the rules
// that actually catch bugs here — unused vars, floating promises are the
// exception — mostly do not need types. If a type-aware rule earns its place
// later, turn it on for that rule rather than for the whole config.
//
// Mirrors FxTool's convention: `lint` reports everything, `lint:errors` is the
// gate. Warnings are for reading; errors block.

import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    // Build output, deps and generated artifacts. `dist` especially: linting
    // compiled output produces hundreds of findings about code nobody wrote.
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '**/*.d.ts',
      'src/p5-compat/**',   // vendored compatibility shim, not ours to restyle
    ],
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { impliedStrict: true } },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      // ── things that are almost always a bug ──────────────────────────────
      // Base `no-unused-vars` misreads TypeScript (type-only imports, enum
      // members, parameter properties), so the TS version replaces it.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        // A destructured rest sibling is how you deliberately drop keys —
        // flagging it pushes people toward worse code.
        ignoreRestSiblings: true,
      }],
      'no-undef': 'off',              // TypeScript already proves this, better
      'no-dupe-keys': 'error',        // a duplicate key silently wins; this repo
                                      // ships large literal tool definitions
      'no-dupe-class-members': 'off', // TS overloads are legal
      '@typescript-eslint/no-dupe-class-members': 'error',
      'no-unreachable': 'error',
      'no-fallthrough': 'error',
      // 'except-parens', NOT 'always'. The deliberate, parenthesised
      // `while ((m = re.exec(s)) !== null)` is the correct way to iterate a
      // global regex, and 'always' flags it — the two hits in this repo were
      // both that idiom, i.e. the config being wrong rather than the code.
      // 'except-parens' still catches the typo this rule exists for, `if (x = 5)`.
      'no-cond-assign': ['error', 'except-parens'],
      'no-self-compare': 'error',
      'no-unsafe-negation': 'error',
      'valid-typeof': 'error',
      'use-isnan': 'error',
      'no-constant-condition': ['error', { checkLoops: false }],
      // ON, deliberately. Two eval() calls already exist behind
      // `eslint-disable-next-line no-eval` comments — a fallback path for
      // pre-governor FxTool builds. With the rule off those disables were dead
      // and eslint reported them as such; with it on they become meaningful
      // again AND a NEW, unmarked eval cannot slip in unnoticed. That matters
      // in a server that executes model-generated code.
      'no-eval': 'error',
      'no-implied-eval': 'error',

      // ── style, reported but not blocking ─────────────────────────────────
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'prefer-const': 'warn',
      'no-var': 'error',
      eqeqeq: ['warn', 'smart'],
    },
  },
  {
    // Tests do things production code should not: redefine globals, leave
    // deliberate no-ops, assert on shapes that are intentionally wrong.
    files: ['**/*.test.ts', 'src/__tests__/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-empty': 'off',
    },
  },
];
