import React from 'react';
import { Toaster } from 'react-hot-toast';
import { headers } from 'next/headers';
import '../styles/globals.css';

export default async function RootLayout({ children, params }: { children: React.ReactNode; params?: any }) {
  {
    const host = headers().get('host');
    const url = headers().get('x-url');
  }

  return (
    <html lang='zh' data-theme={'light'}>
      <head>
        <meta charSet='utf-8' />
        {/*<link rel='icon' type='image/png' href='/assets/logo-200.png' />*/}
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover'
        />
        <title>{`DEMO`}</title>
      </head>
      <body className='flex h-full flex-col'>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
