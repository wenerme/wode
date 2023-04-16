module.exports = {
  root: true,
  // extends: ['@wener/wode/eslint-config/base.cjs'],
  extends: [
    require.resolve('@wener/wode/eslint-config/base.cjs'),
  ],
  rules: {
    '@typescript-eslint/await-thenable': 'warn',
    '@typescript-eslint/naming-convention': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/no-extraneous-class': 'off',
  },
};
