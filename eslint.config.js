import eslint from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      '.vercel/**',
      '.kilo/**',
      '.codex/**',
      '.agents/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/.env*',
      'frontend/src/assets/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['backend/**/*.ts', 'frontend/**/*.{ts,tsx}', 'shared/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['frontend/src/**/*.{ts,tsx}', 'frontend/*.ts'],
    languageOptions: { globals: { ...globals.browser, ...globals.es2021 } },
    plugins: { 'react-hooks': reactHooks },
    rules: { ...reactHooks.configs.flat.recommended.rules },
  },
  {
    files: ['backend/**/*.ts', 'shared/**/*.ts', 'tests/**/*.mjs', 'scripts/**/*.mjs'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['backend/src/types.ts'],
    rules: { '@typescript-eslint/no-namespace': 'off' },
  },
  {
    files: ['eslint.config.js', 'frontend/*.config.ts'],
    languageOptions: { globals: globals.node },
  },
)
