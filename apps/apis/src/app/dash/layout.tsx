import React from 'react';
import '../styles/global.css';

export default function RootLayout({ children, params }: { children: React.ReactNode; params?: any }) {
  return (
    <html lang='zh' data-theme={'corporate'}>
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
