import React from 'react';
import '../styles/global.css';
import { languages } from '../i18n/settings';
import { dir } from 'i18next';

export async function generateStaticParams() {
  return languages.map((lng) => ({ lng }));
}

export default function RootLayout({ children, params: { lang } }: {
  children: React.ReactNode;
  params: { lang: string }
}) {
  return (
    <html lang={lang} dir={dir(lang)} data-theme={'corporate'}>
    <head>
      <meta charSet='utf-8' />
      <link rel='icon' type='image/svg+xml' href='/assets/images/svg/WenerSquredTitledBlue.svg' />
      <meta
        name='viewport'
        content='width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover'
      />
      <title>Wener APIs</title>
    </head>
    <body>{children}</body>
    </html>
  );
}
