module.exports = {
  extends: [
    require.resolve('./base.cjs'),
    'next',

    // ESLint couldn't determine the plugin uniquely
    // https://github.com/vercel/next.js/tree/canary/packages/eslint-config-next
    // 'next/core-web-vitals',
    // 'next',
  ],
};
