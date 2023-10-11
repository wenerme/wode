module.exports = {
  plugins: {
    'tailwindcss/nesting': {},
    tailwindcss: {},
    // 'postcss-focus-visible': {
    //   replaceWith: '[data-focus-visible-added]',
    // },
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {}),
  },
};
