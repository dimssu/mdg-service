/**
 * ESM-aware Jest config for the Dealer Kavach backend.
 *
 * Why .cjs: jest expects a CommonJS config loader by default, and the
 * backend is `"type": "module"`. We avoid the ts-node dependency by
 * keeping the config plain JS.
 *
 * Tests run as ESM (necessary for top-level `await import(...)` in
 * `registry.ts` and `.ts` import specifiers with `.js` suffixes). The
 * `NODE_OPTIONS=--experimental-vm-modules` flag is set in the npm script.
 */
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/?(*.)+(test).ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@dk/shared$': '<rootDir>/../shared/src/index.ts',
    '^@dk/shared/schemas$': '<rootDir>/../shared/src/schemas/index.ts',
    '^@dk/shared/types$': '<rootDir>/../shared/src/types/index.ts',
  },
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'ESNext',
          moduleResolution: 'Bundler',
          target: 'ES2022',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          isolatedModules: true,
          strict: true,
          skipLibCheck: true,
          resolveJsonModule: true,
          types: ['node', 'jest'],
        },
        diagnostics: {
          ignoreCodes: [2742, 2589],
        },
      },
    ],
  },
  collectCoverageFrom: [
    'src/services/registry.ts',
    'src/utils/**/*.ts',
    'src/middleware/**/*.ts',
    'src/scheduler/**/*.ts',
    'src/services/**/index.ts',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    'src/services/registry.ts': { lines: 70 },
    './src/utils/': { lines: 70 },
    './src/middleware/': { lines: 70 },
    './src/scheduler/': { lines: 70 },
  },
  coverageReporters: ['text', 'text-summary', 'lcov'],
  testTimeout: 30000,
  setupFiles: ['<rootDir>/test/jest.env.ts'],
  globalSetup: '<rootDir>/test/global-setup.ts',
  globalTeardown: '<rootDir>/test/global-teardown.ts',
  maxWorkers: 1,
};
