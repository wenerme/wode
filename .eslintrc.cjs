module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2021: true
  },
  extends: [
    "plugin:react/recommended"
    // 'prettier',
  ],
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      parser: "@typescript-eslint/parser",
      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/stylistic-type-checked",
        "plugin:react/recommended"
        // 'prettier',
      ],
      rules: {
        // https://eslint.org/docs/latest/rules
        "comma-dangle": "off",
        semi: "off",
        "prefer-regex-literals": "off",
        "space-before-function-paren": "off",
        "no-lone-blocks": "off",
        "no-unused-vars": "off",
        //
        "react/prop-types": "off",
        "react/display-name": "warn",
        //
        "@typescript-eslint/no-explicit-any": "off", // when using any, it's mean to use the workaround
        "@typescript-eslint/naming-convention": "off", // case by case, external args, some const prefer PascalCase
        "@typescript-eslint/prefer-nullish-coalescing": "off", // || just make things easier
        "@typescript-eslint/consistent-type-imports": "error", // prefer import type avoid some bundle & decorator problem
        "@typescript-eslint/array-type": "off"
        // '@typescript-eslint/no-unused-vars': 'warn',
        // '@typescript-eslint/await-thenable': 'warn',
        // '@typescript-eslint/no-non-null-assertion': 'warn',
        // '@typescript-eslint/no-floating-promises': 'warn',

        // https://typescript-eslint.io/rules/
        // '@typescript-eslint/space-before-function-paren': 'off',
        // '@typescript-eslint/comma-dangle': 'off',
        // '@typescript-eslint/semi': 'off',
        // '@typescript-eslint/no-empty-interface': 'off',
        // '@typescript-eslint/strict-boolean-expressions': 'off',
        // '@typescript-eslint/explicit-function-return-type': 'off',
        // '@typescript-eslint/method-signature-style': 'off',
        // '@typescript-eslint/promise-function-async': 'off',
        // '@typescript-eslint/restrict-template-expressions': 'off',
        // '@typescript-eslint/prefer-nullish-coalescing': 'off',

        // avoid errors in esbuild
        // '@typescript-eslint/consistent-type-imports': 'warn',
        // '@typescript-eslint/consistent-type-exports': 'error',
        // too strict
        // '@typescript-eslint/array-type': [
        //   'off',
        //   {
        //     default: 'array-simple',
        //   },
        // ],
        // '@typescript-eslint/no-extraneous-class': ['error', { allowStaticOnly: true, allowWithDecorator: true }],
        // '@typescript-eslint/no-redeclare': [
        //   'warn',
        //   {
        //     ignoreDeclarationMerge: true,
        //   },
        // ],
        // '@typescript-eslint/no-misused-promises': [
        //   'error',
        //   {
        //     checksVoidReturn: false,
        //   },
        // ],
        // 'react/prop-types': 'off',
      },
      parserOptions: {
        project: ["./tsconfig.json"] // Specify it only for TypeScript files
      }
    }
    // {
    //   files: ['*.cjs','*.mjs'],
    //   rules: {
    //     'comma-dangle': 'off',
    //     'semi': 'off',
    //   },
    // },
  ],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: true,
    tsconfigRootDir: __dirname
  },
  plugins: ["react", "@typescript-eslint"],
  rules: {},
  settings: {
    react: {
      version: "detect"
    }
  }
};
