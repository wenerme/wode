import containerQueries from '@tailwindcss/container-queries';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import daisyuiPlugin from 'daisyui';

export function createConfig(opts = {}) {
  const { daisyui } = opts;
  /** @type {import("tailwindcss").Config} */
  let config = {
    mode: 'jit',
    content: ['./src/**/*.{html,ts,tsx,js,jsx,mdx}', 'node_modules/common/src/**/*.{html,ts,tsx,js,jsx,mdx}'],
    safelist: [{ pattern: /^(btn|input)-/ }],
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
      typography,
      containerQueries,
      forms,
      // https://github.com/tailwindlabs/tailwindcss.com/blob/ceb07ba4d7694ef48e108e66598a20ae31cced19/tailwind.config.js#L280-L284
      function ({ addVariant }) {
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
    daisyui: {
      logs: false,
      themes: [
        'light',
        'dark',
        'cupcake',
        'bumblebee',
        'emerald',
        'corporate',
        'synthwave',
        'retro',
        'cyberpunk',
        'valentine',
        'halloween',
        'garden',
        'forest',
        'aqua',
        'lofi',
        'pastel',
        'fantasy',
        'wireframe',
        'black',
        'luxury',
        'dracula',
        'cmyk',
        'autumn',
        'business',
        'acid',
        'lemonade',
        'night',
        'coffee',
        'winter',
      ],
      ...(daisyui && typeof daisyui === 'object' ? daisyui : {}),
    },
  };
  if (daisyui ?? true) {
    config.plugins.push(daisyuiPlugin);
  }
  return config;
}

// module.exports = createConfig();
export default createConfig();
