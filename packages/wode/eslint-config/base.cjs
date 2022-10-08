module.exports = {
  'env': {
    'node': true,
    'browser': true,
    'es2021': true,
  },
  'extends': [
    'plugin:react/recommended',
    'standard-with-typescript',
    'prettier',
  ],
  'overrides': [
    // {
    //   files: ['*.ts', '*.tsx'],
    //   parser: '@typescript-eslint/parser',
    //   rules: {
    //     'comma-dangle': 'off',
    //   },
    // },
    // {
    //   files: ['*.cjs','*.mjs'],
    //   rules: {
    //     'comma-dangle': 'off',
    //     'semi': 'off',
    //   },
    // },
  ],
  'parserOptions': {
    'ecmaVersion': 'latest',
    'sourceType': 'module',
    'project': ['tsconfig.json'],
  },
  'plugins': [
    'react',
  ],
  'rules': {
    // https://eslint.org/docs/latest/rules
    'comma-dangle': 'off',
    'semi': 'off',
    'prefer-regex-literals': 'off',
    'space-before-function-paren': 'off',
    'no-lone-blocks': 'off',
    // https://typescript-eslint.io/rules/
    '@typescript-eslint/space-before-function-paren': 'off',
    '@typescript-eslint/comma-dangle': 'off',
    '@typescript-eslint/semi': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/method-signature-style': 'off',
    '@typescript-eslint/promise-function-async': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/array-type': [
      'off',
      {
        default: 'array-simple',
      },
    ],
    '@typescript-eslint/no-redeclare': [
      'error',
      {
        ignoreDeclarationMerge: true,
      },
    ],
    '@typescript-eslint/no-misused-promises': [
      'error',
      {
        'checksVoidReturn': false,
      },
    ],
  },
  'settings': {
    'react': {
      'version': 'detect',
    },
  },
};
