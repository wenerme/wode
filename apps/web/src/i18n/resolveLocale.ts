import { match } from '@formatjs/intl-localematcher';
import { getLocales } from '@/i18n/getLocales';

export function resolveLocale(locale?: string | null) {
  const { locales, defaultLocale } = getLocales();
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
