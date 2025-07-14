module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  plugins: [
    '@typescript-eslint'
  ],
  extends: [
    'eslint:recommended'
  ],
  rules: {
    // Basic rules only
    'no-console': 'warn',
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    'no-unused-vars': 'off'
  },
  env: {
    node: true,
    es2020: true,
    jest: true
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parserOptions: {
        project: './tsconfig.json'
      }
    },
    {
      files: ['tests/**/*.ts', 'tests/**/*.tsx'],
      parserOptions: {
        project: './tsconfig.jest.json'
      }
    }
  ],
  ignorePatterns: [
    'dist/',
    'coverage/',
    'node_modules/'
  ]
};
