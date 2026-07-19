import eslint from '@eslint/js'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'

const platformGlobals = ['Date', 'crypto', 'fetch', 'performance', 'setInterval', 'setTimeout']

export default defineConfig(
  {
    ignores: [
      '**/dist/**',
      '**/dist-types/**',
      '**/build/**',
      '**/coverage/**',
      '**/node_modules/**',
      'scripts/**',
      'test/consumer/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    files: ['*.cjs'],
    languageOptions: {
      globals: {
        module: 'readonly',
      },
    },
  },
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['packages/flow-core/src/**/*.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        ...platformGlobals.map((name) => ({
          name,
          message: `${name} is a platform global and is forbidden in @flowgraph/core`,
        })),
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['node:*', '@flowgraph/session', '@flowgraph/*/*'],
              message: 'Core must remain platform-free and use public package roots only',
            },
          ],
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'Randomness is forbidden in @flowgraph/core',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ClassDeclaration',
          message: 'Classes are forbidden in @flowgraph/core',
        },
        {
          selector: 'ClassExpression',
          message: 'Classes are forbidden in @flowgraph/core',
        },
      ],
    },
  },
  {
    files: ['packages/flow-session/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@flowgraph/core/*'],
              message: 'Session may import only the public @flowgraph/core root',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/flow-react/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@flowgraph/core/*', '@flowgraph/session/*'],
              message: 'React adapter may import only public FlowGraph package roots',
            },
          ],
        },
      ],
    },
  },
)
