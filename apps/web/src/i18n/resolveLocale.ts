import type { Locale } from '@lingui/core';

const locales = ['zh-CN', 'en'];

export function resolveLocale(locale?: string) {
  locale = (locales.includes(locale || '') ? locale : locales[0]) as Locale;
  return {
    locale,
    locales,
  };
}

export function getLocales() {
  return locales;
}
