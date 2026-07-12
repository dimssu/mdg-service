/**
 * Root ESLint config for the Dealer Kavach monorepo.
 *
 * - Backend (Node, no React) and frontend (browser, React) get their own
 *   overrides so we don't pollute one with the other's rules.
 * - The `_` underscore-prefix convention is honoured for unused args/vars.
 */
module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: [
          'shared/tsconfig.json',
          'backend/tsconfig.json',
          'frontend/tsconfig.json',
        ],
      },
      node: true,
    },
  },
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/consistent-type-imports': [
      'warn',
      { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
    ],
    'import/order': [
      'warn',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'import/no-unresolved': 'off',
    // CJS packages re-exported under NodeNext (jsonwebtoken, node-cron, bcryptjs,
    // cron-parser, react, react-dom/client) trip these rules even though their
    // default exports are well-defined. TypeScript already validates the import
    // shapes; the plugin's static analysis is the false positive here.
    'import/default': 'off',
    'import/no-named-as-default': 'off',
    'import/no-named-as-default-member': 'off',
    // Scheduler intentionally uses `while (true)` to claim jobs until exhaustion.
    'no-constant-condition': ['error', { checkLoops: false }],
  },
  overrides: [
    {
      files: ['frontend/**/*.{ts,tsx}'],
      env: {
        browser: true,
        node: false,
      },
      plugins: ['react', 'react-hooks'],
      extends: [
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
      ],
      settings: {
        react: { version: 'detect' },
      },
      rules: {
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',
      },
    },
    {
      files: ['backend/**/*.ts'],
      env: {
        node: true,
        browser: false,
      },
      rules: {
        // backend imports are ESM with explicit `.js` extensions; let TS handle this.
      },
    },
    {
      files: [
        '**/*.test.ts',
        '**/*.test.tsx',
        'backend/test/**/*.ts',
      ],
      env: {
        jest: true,
        node: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      files: ['shared/**/*.ts'],
      env: {
        node: true,
        browser: true,
      },
    },
    {
      // mdg-demo: Remotion compositions render in a browser, and the guide site
      // under site/ is hand-written browser JS with no bundler — both need the
      // DOM globals. The build scripts alongside them are Node.
      files: ['mdg-demo/**/*.{ts,tsx,js,mjs,mts}'],
      env: {
        node: true,
        browser: true,
      },
    },
  ],
};
