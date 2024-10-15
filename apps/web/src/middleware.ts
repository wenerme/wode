import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { NextRequest, NextResponse, userAgent } from 'next/server';
import { getLocales } from '@/i18n/resolveLocale';

function getLocale({ headers }: NextRequest) {
  const locales = getLocales();
  let accept = headers.get('accept-language');
  let languages = new Negotiator({
    headers: {
      'accept-language': accept || '',
    },
  }).languages();
  const defaultLocale = 'zh-CN';
  try {
    return match(locales, languages, defaultLocale);
  } catch (e) {
    // languages=['*']
    console.error(`[getLocale] `, headers.get('accept-language'), locales, languages, String(e));
    return defaultLocale;
  }
}

export async function middleware(req: NextRequest) {
  // middleware 的 Runtime 为 Edge  Runtime
  // https://github.com/vercel/next.js/discussions/34179

  let locales = getLocales();
  const { pathname } = req.nextUrl;
  const pathnameHasLocale = locales.some((locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`);
  if (!pathnameHasLocale) {
    const locale = getLocale(req);
    req.nextUrl.pathname = `/${locale}${pathname}`;
    console.log(`> Redirect to ${req.nextUrl}`);
    return NextResponse.redirect(req.nextUrl);
  }

  const { url, method, nextUrl } = req;
  console.log(`> ${method} ${nextUrl} ${userAgent(req).ua}`);

  // 隐藏的获取 url 的方式，替代 pathname
  // https://github.com/vercel/next.js/issues/57762
  // headers().get('next-url')

  // server component 能获取到 pathname
  // const headers = new Headers(req.headers);
  // headers.set('x-url', req.url);
  //
  // return NextResponse.next({
  //   request: {
  //     headers: headers,
  //   },
  // });
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
