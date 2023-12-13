// const plugin = require('tailwindcss/plugin');
import containerQueries from '@tailwindcss/container-queries';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import daisyuiPlugin from 'daisyui';
import animatePlugin from 'tailwindcss-animate';

const isPreferPx = Boolean(process.env.TW_PX);

const px = {
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px',
    '6xl': '60px',
    '7xl': '72px',
  },
  spacing: {
    px: '1px',
    0: '0',
    0.5: '2px',
    1: '4px',
    1.5: '6px',
    2: '8px',
    2.5: '10px',
    3: '12px',
    3.5: '14px',
    4: '16px',
    5: '20px',
    6: '24px',
    7: '28px',
    8: '32px',
    9: '36px',
    10: '40px',
    11: '44px',
    12: '48px',
    14: '56px',
    15: '60px',
    16: '64px',
    20: '80px',
    24: '96px',
    28: '112px',
    32: '128px',
    36: '144px',
    40: '160px',
    44: '176px',
    48: '192px',
    52: '208px',
    56: '224px',
    60: '240px',
    64: '256px',
    72: '288px',
    80: '320px',
    96: '384px',
  },
  extend: {
    lineHeight: {
      3: '12px',
      4: '16px',
      5: '20px',
      6: '24px',
      7: '28px',
      8: '32px',
      9: '36px',
      10: '40px',
    },
  },
};

function rem2px(input, fontSize = 16) {
  if (input == null) {
    return input;
  }
  switch (typeof input) {
    case 'object':
      if (Array.isArray(input)) {
        return input.map((val) => rem2px(val, fontSize));
      }
      const ret = {};
      for (const key in input) {
        ret[key] = rem2px(input[key], fontSize);
      }
      return ret;
    case 'string':
      return input.replace(/(\d*\.?\d+)rem$/, (_, val) => `${parseFloat(val) * fontSize}px`);
    case 'function':
      return eval(input.toString().replace(/(\d*\.?\d+)rem/g, (_, val) => `${parseFloat(val) * fontSize}px`));
    default:
      return input;
  }
}

export function createConfig(opts = {}) {
  const { daisyui } = opts;
  /** @type {import('tailwindcss').Config} */
  let config = {
    mode: 'jit',
    content: [
      './src/**/*.{html,ts,tsx,js,jsx,mdx}',
      'node_modules/common/src/**/*.{html,ts,tsx,js,jsx,mdx}',
      'node_modules/@wener/console/src/**/*.{html,ts,tsx,js,jsx,mdx}',
    ],
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
      animatePlugin,
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
        'dim',
        'nord',
        'subset',
      ],
      ...(daisyui && typeof daisyui === 'object' ? daisyui : {}),
    },
  };
  if (daisyui ?? true) {
    config.plugins.push(daisyuiPlugin);
  }

  // if (isPreferPx) {
  //   // fix margin
  //   Object.assign(config.theme, px);
  //   config.daisyui.themes = ['corporate']
  // }
  return config;
}

// module.exports = createConfig();
export default createConfig();
