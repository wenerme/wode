import cookie from 'cookie';
import { getLocales } from '@/i18n/getLocales';
import { resolveRequestLocale, type ResolveRequestLocaleOptions } from '@/i18n/resolveRequestLocale';

export async function resolveCurrentLocale(opts: Partial<ResolveRequestLocaleOptions> = {}) {
  if (typeof window === 'undefined') {
    const { headers, cookies } = await import('next/headers');
    let hdr = headers();
    opts.accept ??= hdr.get('accept-language');
    if (typeof opts.query !== 'string') {
      let u = hdr.get('x-url');
      if (u) {
        try {
          opts.query = new URL(u).searchParams.get('lang');
        } catch (e) {
          console.error(`[${resolveCurrentLocale.name}] parse x-url`, String(e));
        }
      }
    }
    opts.cookie ??= cookies().get('lang')?.value;
  } else {
    opts.cookie ??= cookie.parse(document.cookie)['lang'];
    opts.query ??= location.search ? new URLSearchParams(location.search).get('lang') : undefined;
    opts.languages ??= navigator.languages;
  }

  return resolveRequestLocale({
    ...opts,
    ...getLocales(),
  });
}
