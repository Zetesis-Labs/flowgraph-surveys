import { defineProject } from 'vitest/config'

export default [
  defineProject({
    root: `${import.meta.dirname}/packages/flow-core`,
    test: {
      name: 'core',
      include: ['test/**/*.test.ts'],
      setupFiles: ['./test/setup.ts'],
      sequence: { shuffle: false },
    },
  }),
  defineProject({
    root: `${import.meta.dirname}/packages/flow-session`,
    test: {
      name: 'session',
      include: ['test/**/*.test.ts'],
      sequence: { shuffle: false },
    },
  }),
  defineProject({
    root: `${import.meta.dirname}/packages/flow-react`,
    test: {
      name: 'react',
      environment: 'jsdom',
      include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
      setupFiles: ['./test/setup.ts'],
      sequence: { shuffle: false },
    },
  }),
  defineProject({
    root: `${import.meta.dirname}/apps/survey-demo`,
    test: {
      name: 'survey-demo',
      environment: 'jsdom',
      include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
      setupFiles: ['./test/setup.ts'],
      sequence: { shuffle: false },
    },
  }),
]
