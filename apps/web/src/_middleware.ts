import { NextRequest, userAgent } from 'next/server';

export async function middleware(req: NextRequest) {
  // middleware 的 Runtime 为 Edge  Runtime
  // https://github.com/vercel/next.js/discussions/34179

  const { url, method, nextUrl } = req;
  console.log(`${method} ${nextUrl} ${userAgent(req).ua}`);

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
