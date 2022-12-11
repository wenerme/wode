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

  plugins: [
    require('prettier-plugin-pkg'),
    require('prettier-plugin-tailwindcss'),
    require('@trivago/prettier-plugin-sort-imports'),
  ],
  tailwindConfig: './tailwind.config.cjs',
};
