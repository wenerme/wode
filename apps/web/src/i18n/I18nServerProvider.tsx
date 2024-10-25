import React, { type PropsWithChildren } from 'react';
import { I18nClientProvider } from '@/i18n/LinguiClientProvider';
import { loadI18n } from './loadI18n';

export async function I18nServerProvider({ children }: PropsWithChildren) {
  const { i18n } = await loadI18n();
  return (
    <I18nClientProvider
      initial={{
        locale: i18n.locale,
        messages: {
          [i18n.locale]: i18n.messages,
        },
      }}
    >
      {children}
    </I18nClientProvider>
  );
}
