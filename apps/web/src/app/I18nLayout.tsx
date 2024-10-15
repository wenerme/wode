import React from 'react';
import { LinguiClientProvider } from '@/i18n/LinguiClientProvider';
import { loadI18n } from '@/i18n/loadI18n';
import type { NextLayoutProps } from '@/types';

export const I18nLayout = async ({ children, params }: NextLayoutProps) => {
  const { locale, messages } = await loadI18n({
    lang: params.lang,
    source: 'RootLayout',
  });

  return (
    <LinguiClientProvider initialLocale={locale} initialMessages={messages}>
      {children}
    </LinguiClientProvider>
  );
};
