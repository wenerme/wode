import { expect, test } from 'vitest';
import { resolveLocale } from '@/i18n/resolveLocale';

test('resolveLocale', () => {
  expect(resolveLocale('zh')).toMatchObject({
    locale: 'zh-CN',
  });
  expect(resolveLocale('en-US')).toMatchObject({
    locale: 'en',
  });
});
