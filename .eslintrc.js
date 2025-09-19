module.exports = {
  root: true,
  extends: ['eslint:recommended', '@typescript-eslint/recommended', 'prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // General rules
    'no-console': 'off',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
  },
  overrides: [
    {
      // Next.js specific rules
      files: ['packages/admin-web/**/*.{ts,tsx}'],
      extends: ['next/core-web-vitals'],
      env: {
        browser: true,
      },
      rules: {
        '@next/next/no-img-element': 'error',
        '@next/next/no-html-link-for-pages': 'error',
      },
    },
    {
      // Deno/Edge Functions specific rules
      files: ['packages/edge-functions/**/*.ts'],
      env: {
        node: false,
        browser: false,
      },
      globals: {
        Deno: 'readonly',
      },
      rules: {
        'no-console': 'off', // Allow console in edge functions for logging
        '@typescript-eslint/no-explicit-any': 'off', // More lenient for edge functions
      },
    },
    {
      // Configuration files
      files: ['*.config.js', '*.config.ts', '.eslintrc.js'],
      env: {
        node: true,
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    {
      // Test files
      files: ['**/*.test.{ts,tsx,js,jsx}', '**/*.spec.{ts,tsx,js,jsx}'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
  ignorePatterns: ['node_modules/', 'dist/', 'build/', '.next/', 'out/', '*.d.ts'],
}
