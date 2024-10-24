'use client';

import React, { useEffect, useState } from 'react';
import * as LocaleMatcher from '@formatjs/intl-localematcher';
import { DaisyTheme } from '@wener/console/daisy';
import { WebVitals } from '@wener/console/web';
import { WindowHost } from '@wener/console/web/window';
import { ClientOnly, useEventListener } from '@wener/reaction';
import { parse as parseCookie } from 'cookie';
import { throttle } from 'es-toolkit';
import { useSearchParams } from 'next/navigation';
import { getI18nStore } from '@/i18n/loadI18n';
import { loadMessage } from '@/i18n/loadMessage';
import { resolveClientLocale } from '@/i18n/resolveClientLocale';

export const SiteSidecar = () => {
  useRefreshScrollRestoration();
  useState(() => {
    // polyfill for testing
    (Intl as any).LocaleMatcher ||= LocaleMatcher;
    console.log(`polyfill Intl.LocaleMatcher`, (Intl as any).LocaleMatcher);
    return {};
  });
  return (
    <ClientOnly>
      <DaisyTheme.Sidecar />
      <WindowHost />
      <WebVitals />
      <LocaleSidecar />
    </ClientOnly>
  );
};

const getLangCookie = () => parseCookie(document.cookie)['lang'] || '';
const LocaleSidecar = () => {
  const store = getI18nStore();
  const { i18n } = store.getState();
  let query = useSearchParams().get('lang') || '';
  const [cookie, setCookie] = useState(getLangCookie);
  useEventListener(
    (window as any).cookieStore as EventTarget,
    {
      change: () => {
        setCookie(getLangCookie());
      },
    },
    [],
  );
  useEffect(() => {
    const { locale } = resolveClientLocale({ cookie, query });
    if (locale === i18n.locale) {
      return;
    }
    console.log(`[LocaleSidecar] change locale ${i18n.locale} -> ${locale} query=${query}`);
    Promise.resolve(loadMessage(locale)).then((messages) => {
      i18n.loadAndActivate({ messages, locale });
    });
  }, [query, cookie]);
  return null;
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
