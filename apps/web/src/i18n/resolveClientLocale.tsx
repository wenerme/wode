import cookie from 'cookie';
import { getLocales } from '@/i18n/getLocales';
import { resolveRequestLocale, type ResolveRequestLocaleOptions } from '@/i18n/resolveRequestLocale';

export function resolveClientLocale(opts: Partial<ResolveRequestLocaleOptions> = {}) {
  if (typeof window !== 'undefined') {
    opts.cookie ??= cookie.parse(document.cookie)['lang'];
    opts.query ??= location.search ? new URLSearchParams(location.search).get('lang') : undefined;
    opts.languages ??= navigator.languages;
  }
  return resolveRequestLocale({
    ...opts,
    ...getLocales(),
  });
}
