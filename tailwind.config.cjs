const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  content: [
    './src/**/*.{html,ts,tsx,js,mdx}',
    'node_modules/common/src/**/*.{html,ts,tsx,js,mdx}',
  ],
  safelist: [
    { pattern: /^(btn|input)-/ },
  ],
  darkMode: 'media',
  theme: {
    extend: {
      spacing: {
        15: '3.75rem',
      },
      margin: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-right': 'env(safe-area-inset-right)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/container-queries'),
    require('daisyui'),
    // https://github.com/tailwindlabs/tailwindcss.com/blob/ceb07ba4d7694ef48e108e66598a20ae31cced19/tailwind.config.js#L280-L284
    function({ addVariant }) {
      addVariant(
        'supports-backdrop-blur',
        '@supports (backdrop-filter: blur(0)) or (-webkit-backdrop-filter: blur(0))',
      );
      addVariant('supports-scrollbars', '@supports selector(::-webkit-scrollbar)');
      addVariant('children', '& > *');
      addVariant('scrollbar', '&::-webkit-scrollbar');
      addVariant('scrollbar-track', '&::-webkit-scrollbar-track');
      addVariant('scrollbar-thumb', '&::-webkit-scrollbar-thumb');
    },
    // containerQuery,
  ],
  daisyui: {},
};
