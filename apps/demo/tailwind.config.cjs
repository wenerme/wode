/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  content: ['./src/**/*.{html,ts,tsx,js}'],
  darkMode: 'media',
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui')],
  daisyui: {
    // themes: [
    //   {
    //     light: {
    //       ...require('daisyui/src/colors/themes')['[data-theme=light]'],
    //     },
    //   },
    // ],
  },
};
