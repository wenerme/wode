import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

export type ResolveRequestLocaleOptions = {
  accept?: string | null; // accept-language
  languages?: readonly string[] | null; // navigator.languages
  cookie?: string | null; // cookie string
  query?: string | null; // query string
  defaultLocale: string;
  locales: readonly string[];
};

export function resolveRequestLocale({
  accept,
  query,
  languages,
  locales,
  defaultLocale,
  cookie,
}: ResolveRequestLocaleOptions) {
  let lang: string | null | undefined = query || cookie;

  let requestLocales: string[] = languages?.slice() || [];
  if (!languages?.length && accept) {
    requestLocales = new Negotiator({
      headers: {
        'accept-language': accept,
      },
    }).languages();
    // query is higher priority
  } else if (lang && !requestLocales.length) {
    requestLocales = [lang];
  }

  // higher priority
  if (cookie) {
    requestLocales.unshift(cookie);
  }
  if (query) {
    requestLocales.unshift(query);
  }

  let locale = defaultLocale;
  try {
    locale = match(requestLocales, locales, defaultLocale);
  } catch (e) {
    // languages=['*']
    console.error(
      `[${resolveRequestLocale.name}] `,
      {
        query,
        cookie,
        locales,
        languages: requestLocales,
      },
      String(e),
    );
  }

  return {
    locale,
    locales,
    query,
    cookie,
    languages: requestLocales,
  };
}
