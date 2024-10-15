import React, { Suspense } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ProdOnly } from '@wener/reaction/universal';
import { NextI18nProvider } from '@/app/NextI18nProvider';
import { SiteSidecar } from '@/components/site/SiteSidecar';
import { getSiteData } from '@/data/getSiteData';
import type { NextLayoutProps } from '@/types';

export function NextRootLayout({ children, params }: NextLayoutProps) {
  const { title } = getSiteData();
  const attrs: Record<string, any> = {};
  const lang = params.lang;
  let content = (
    <>
      <Suspense>{children}</Suspense>
      <SiteSidecar />
    </>
  );
  return (
    <html lang={lang || 'zh-CN'} className='white' data-theme='corporate' {...attrs}>
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
        <NextI18nProvider params={params}>{content}</NextI18nProvider>
        <ProdOnly>
          <SpeedInsights />
          <Analytics />
        </ProdOnly>
      </body>
    </html>
  );
}
