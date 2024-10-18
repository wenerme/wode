import React, { Suspense } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ProdOnly } from '@wener/reaction/universal';
import { cookies, headers } from 'next/headers';
import { SiteSidecar } from '@/components/site/SiteSidecar';
import { getSiteData } from '@/data/getSiteData';
import { I18N } from '@/i18n/I18N';
import { Provider } from '@/i18n/Provider';
import { setServerNonce } from '@/server/createServerContext';
import type { NextLayoutProps } from '@/types';

export async function NextRootLayout({ children, params }: NextLayoutProps) {
  setServerNonce();
  const { title } = getSiteData();
  const attrs: Record<string, any> = {};
  const cookieStore = cookies();
  let hdr = headers();
  let locale = hdr.get('x-locale');

  // let query: Record<string, string> = {};
  // {
  //   let u = hdr.get('x-url');
  //   if (u) {
  //     try {
  //       new URL(u).searchParams.forEach((v, k) => {
  //         query[k] = v;
  //       });
  //     } catch (e) {
  //       console.error(`[NextRootLayout] parse x-url`, String(e));
  //     }
  //   }
  // }

  await I18N.load({
    reason: 'RootLayout',
  });

  let theme = cookieStore.get('theme')?.value || 'corporate';
  let colorSchema = cookieStore.get('colorSchema')?.value || 'white';

  attrs['data-theme'] = theme;

  let content = (
    <>
      <Suspense>{children}</Suspense>
      <SiteSidecar />
    </>
  );
  return (
    <html lang={I18N.resolveLocale(locale).locale} className='white' {...attrs}>
      <head>
        <meta charSet='utf-8' />
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover'
        />
        <link rel='icon' href='/favicon.ico' sizes='any' />
        <link rel='icon' href='/icon?<generated>' type='image/<generated>' sizes='<generated>' />
        <title>{title}</title>
      </head>
      <body>
        <Provider>{content}</Provider>
        <ProdOnly>
          <SpeedInsights />
          <Analytics />
        </ProdOnly>
      </body>
    </html>
  );
}
