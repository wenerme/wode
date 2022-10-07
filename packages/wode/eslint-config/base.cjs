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
    'comma-dangle': 'off',
    'semi': 'off',
    'prefer-regex-literals': 'off',
    'space-before-function-paren': 'off',
    // https://typescript-eslint.io/rules/
    '@typescript-eslint/space-before-function-paren': 'off',
    '@typescript-eslint/comma-dangle': 'off',
    '@typescript-eslint/semi': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/method-signature-style': 'off',
  },
  'settings': {
    'react': {
      'version': 'detect',
    },
  },
};
