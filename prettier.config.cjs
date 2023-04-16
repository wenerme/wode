module.exports = {
  bracketSameLine: false,
  trailingComma: 'all',
  printWidth: 120,
  singleQuote: true,
  overrides: [
    {
      files: ['*.html', '*.css'],
      options: {
        singleQuote: false,
      },
    },
    {
      files: '*.svg',
      options: {
        parser: 'html',
      },
    },
  ],
  // @trivago/prettier-plugin-sort-imports
  importOrder: [
    '^react',
    '^[a-z]',
    '^@[^/]',
    '^[.][.]',
    '^[.][/]',
  ],
  importOrderSeparation: false,
  importOrderParserPlugins: ['typescript', 'decorators-legacy'],

  plugins: [
    require('prettier-plugin-pkg'),
    require('prettier-plugin-tailwindcss'),
    require('@trivago/prettier-plugin-sort-imports'),
  ],
  tailwindConfig: './tailwind.config.cjs',
};
