/** @type {import('@lingui/conf').LinguiConfig} */
import { type LinguiConfig } from '@lingui/conf';

const conf: LinguiConfig = {
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

export default conf;
