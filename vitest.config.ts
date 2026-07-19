import { defineConfig } from 'vitest/config'

import projects from './vitest.workspace.js'

export default defineConfig({
  root: import.meta.dirname,
  test: {
    projects,
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**/*.ts'],
      exclude: ['**/*.d.ts'],
      reporter: ['text', 'json-summary', 'html'],
      thresholds: {
        perFile: true,
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
})
