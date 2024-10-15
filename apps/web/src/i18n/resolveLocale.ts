import { match } from '@formatjs/intl-localematcher';

const locales = ['zh-CN', 'en'];
const defaultLocale = 'zh-CN';

export function resolveLocale(locale?: string) {
  try {
    locale = match([locale || locales[0]], locales, defaultLocale);
  } catch (e) {
    locale = defaultLocale;
  }
  return {
    locale,
    locales,
  };
}

export function getLocales() {
  return {
    locales,
    defaultLocale,
  };
}
