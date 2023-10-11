'use client';

import dynamic from 'next/dynamic';

const Content = dynamic(() => import('../../client/console/ConsoleApp'), {
  ssr: false,
});
export default function () {
  return <Content />;
}
