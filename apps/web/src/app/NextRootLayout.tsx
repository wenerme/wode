import React, { Suspense } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ProdOnly } from '@wener/reaction/universal';
import { cookies } from 'next/headers';
import { SiteSidecar } from '@/components/site/SiteSidecar';
import { getSiteData } from '@/data/getSiteData';
import { loadI18n } from '@/i18n';
import { I18nServerProvider } from '@/i18n/I18nServerProvider';
import { setServerNonce } from '@/server/createServerContext';
import type { NextLayoutProps } from '@/types';

export async function NextRootLayout({ children, params }: NextLayoutProps) {
  setServerNonce();
  // let locale = hdr.get('x-locale');
  const { i18n } = await loadI18n({
    reason: 'RootLayout',
  });
  const { title } = getSiteData();
  const attrs: Record<string, any> = {};
  const cookieStore = await cookies();
  // let hdr = headers();
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

  let theme = cookieStore.get('theme')?.value || 'corporate';
  let colorSchema = cookieStore.get('colorSchema')?.value || 'white';

  attrs['data-theme'] = theme;

  return (
    <html lang={i18n.locale} className='white' {...attrs}>
      <head>
        {/* NextJS already add these
        <meta charSet='utf-8' />
        */}
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover'
        />
        <link rel='icon' href='/favicon.ico' sizes='any' />
        <link rel='icon' href='/icon?<generated>' type='image/<generated>' sizes='<generated>' />
        <title>{title}</title>
      </head>
      <body>
        <I18nServerProvider>
          <Suspense>{children}</Suspense>
          <SiteSidecar />
        </I18nServerProvider>
        <ProdOnly>
          <SpeedInsights />
          <Analytics />
        </ProdOnly>
      </body>
    </html>
  );
}
