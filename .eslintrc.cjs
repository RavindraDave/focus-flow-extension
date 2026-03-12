module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
    webextensions: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: ['./tsconfig.json'],
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // TypeScript Strict Rules - No `any` types
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    '@typescript-eslint/no-unsafe-argument': 'error',

    // Explicit return types for public functions
    '@typescript-eslint/explicit-module-boundary-types': 'error',
    '@typescript-eslint/explicit-function-return-type': ['error', {
      allowExpressions: true,
      allowTypedFunctionExpressions: true,
      allowHigherOrderFunctions: true,
    }],

    // Code Quality - Cyclomatic Complexity
    'complexity': ['error', 10],

    // Function Length (max 50 lines)
    'max-lines-per-function': ['error', {
      max: 50,
      skipBlankLines: true,
      skipComments: true,
      IIFEs: false,
    }],

    // Max Parameters (max 4)
    'max-params': ['error', 4],

    // Prevent unused variables
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],

    // React Rules
    'react/react-in-jsx-scope': 'off', // Not needed in React 18
    'react/prop-types': 'off', // Using TypeScript

    // General Best Practices
    'no-console': ['warn', { allow: ['warn', 'error', 'info', 'log'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'no-throw-literal': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/require-await': 'warn',

    // Security
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
  },
  overrides: [
    {
      // Relax rules for background scripts (console logging is useful for debugging)
      files: ['src/background/**/*.ts'],
      rules: {
        'no-console': 'off',
        'max-lines-per-function': ['warn', { max: 60 }],
      },
    },
    {
      // Relax rules for test files
      files: ['**/*.test.ts', '**/*.test.tsx', 'tests/**/*.ts', 'tests/**/*.spec.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/unbound-method': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        'max-lines-per-function': 'off',
        'complexity': 'off',
        '@typescript-eslint/require-await': 'off',
      },
    },
    {
      // Relax rules for type declaration files
      files: ['**/*.d.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
  ],
  ignorePatterns: [
    'dist',
    'build',
    'node_modules',
    '*.config.js',
    '*.config.ts',
    'vite.config.ts',
    'tailwind.config.js',
    'postcss.config.js',
  ],
};
