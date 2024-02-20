import { Links, Meta, Outlet, Scripts, ScrollRestoration } from '@remix-run/react';
import '../../app/console/styles/global.css';

export default function App() {
  return (
    <html lang='en' data-theme='light'>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <title>apki</title>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
