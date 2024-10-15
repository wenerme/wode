'use client';

import { useEffect } from 'react';
import { DaisyTheme } from '@wener/console/daisy';
import { WindowHost } from '@wener/console/web/window';
import { throttle } from 'es-toolkit';

export const SiteSidecar = () => {
  useRefreshScrollRestoration();
  return (
    <>
      <DaisyTheme.Sidecar />
      <WindowHost />
    </>
  );
};

function useRefreshScrollRestoration() {
  // handle refresh scroll restoration

  // alternative https://github.com/RevoTale/next-scroll-restorer
  // https://github.com/vercel/next.js/discussions/33777#discussioncomment-2148021
  useEffect(() => {
    const pageAccessedByReload = window.performance
      .getEntriesByType('navigation')
      .map((nav: any) => nav?.type)
      .includes('reload');

    if (pageAccessedByReload) {
      const scrollPosition = Number.parseInt(sessionStorage.getItem('scrollPosition') || '0', 10);
      if (scrollPosition) {
        window.scrollTo(0, scrollPosition);
      }
    }

    const handleScroll = throttle(() => {
      sessionStorage.setItem('scrollPosition', String(window.scrollY));
    }, 500);

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
}
