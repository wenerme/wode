/** @type {import('@lingui/conf').LinguiConfig} */
module.exports = {
  locales: ['zh-CN', 'en'],
  sourceLocale: 'zh-CN',
  catalogs: [
    {
      path: '<rootDir>/src/locales/{locale}/messages',
      include: ['src'],
    },
  ],
  format: 'po',
};
