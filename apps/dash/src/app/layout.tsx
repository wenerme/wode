import React from 'react';
import { SessionProvider } from 'next-auth/react';
import './styles/global.css';

export default function RootLayout({
  children,
  params: { lang },
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  return (
    <html lang={'zh'} data-theme={'corporate'}>
      <head>
        <meta charSet='utf-8' />
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
