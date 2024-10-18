import { NextRequest, NextResponse, userAgent } from 'next/server';
import { resolveCurrentLocale } from '@/i18n/resolveCurrentLocale';

export async function middleware(req: NextRequest) {
  // middleware 的 Runtime 为 Edge  Runtime
  // https://github.com/vercel/next.js/discussions/34179

  // {
  //   const { locales, defaultLocale } = getLocales();
  //   const { pathname } = req.nextUrl;
  //   const [, loc] = pathname.split('/');
  //   const pathnameHasLocale = locales.includes(loc);
  //   if (!pathnameHasLocale) {
  //     let locale: string | undefined;
  //     if (loc) {
  //       try {
  //         [locale] = Intl.getCanonicalLocales(loc);
  //       } catch (e) {}
  //     }
  //     locale ||= getLocale({
  //       defaultLocale,
  //       locales: locales,
  //       accept: req.headers.get('accept-language'),
  //     });
  //     ({ locale } = resolveLocale(locale));
  //     req.nextUrl.pathname = `/${locale}${pathname}`;
  //     console.log(`> Redirect to locale ${locale} ${req.nextUrl}`);
  //     return NextResponse.redirect(req.nextUrl);
  //   }
  // }

  const headers = new Headers(req.headers);
  headers.set('x-url', req.nextUrl.toString());

  const handleResponse: ((res: NextResponse) => void)[] = [];

  {
    const { locale, query, cookie, languages } = await resolveCurrentLocale({
      query: req.nextUrl.searchParams.get('lang') || '',
      cookie: req.cookies.get('lang')?.value || '',
      accept: req.headers.get('accept-language') || '',
    });
    // console.log(`> Resolve locale=${locale} query=${query} cookie=${cookie} languages=${languages}`);
    if (query && locale !== cookie) {
      handleResponse.push((res) => {
        console.log(`> Set cookie lang=${locale} because query=${query} cookie=${cookie}`);
        res.cookies.set('lang', locale);
      });
    }
    headers.set('x-locale', locale);
  }

  const { url, method, nextUrl } = req;
  console.log(`> ${method} ${nextUrl} ${userAgent(req).ua}`);

  const res = NextResponse.next({
    request: {
      headers,
    },
  });

  for (const f of handleResponse) {
    f(res);
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - icons.png (icons file)
     */
    '/((?!api|__next|_next/static|_next/image|favicon.ico|icon.png).*)',
  ],
};
