import React, { Suspense } from 'react';
import './globals.css';
import { SiteSidecar } from '@/components/site/SiteSidecar';
import { getSiteData } from '@/data/getSiteData';
import type { NextLayoutProps } from '@/types';

// export const revalidate = 300;

export default async function RootLayout({ children, params }: NextLayoutProps) {
  const { title } = getSiteData();
  const attrs: Record<string, any> = {};
  return (
    <html lang='zh' className='white' data-theme='corporate' {...attrs}>
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
        <Suspense>{children}</Suspense>
        <SiteSidecar />
      </body>
    </html>
  );
}
