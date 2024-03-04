import React from 'react';
import { RootContext } from './RootContext';
import { WebVitals } from './WebVitals';
import './globals.css';

export default async function RootLayout({ children, params }: { children: React.ReactNode; params?: any }) {
  const attrs: Record<string, any> = {};

  return (
    <html lang='zh' className={'white'} data-theme={'corporate'} {...attrs}>
      <head>
        <meta charSet='utf-8' />
        {/*<link rel="icon" type="image/png" href="/assets/logo-200.png" />*/}
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover'
        />
        <title>Console</title>
      </head>
      <body className='flex h-full flex-col'>
        {children}
        <RootContext />
        <WebVitals />
      </body>
    </html>
  );
}
