'use client';

import React, { useState, type FC, type ReactNode } from 'react';
import { setupI18n, type AllMessages, type Messages } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { getI18nStore } from '@/i18n/loadI18n';

export function LinguiClientProvider({
  children,
  initialLocale,
  initialMessages,
}: {
  children: React.ReactNode;
  initialLocale: string;
  initialMessages: Messages;
}) {
  const [i18n] = useState(() => {
    return setupI18n({
      locale: initialLocale,
      messages: { [initialLocale]: initialMessages },
    });
  });
  return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
}

export const I18nClientProvider: FC<{
  children: ReactNode;
  initial?: {
    locale: string;
    messages: AllMessages;
  };
}> = ({ children, initial }) => {
  const [i18n] = useState(() => {
    let i18n = getI18nStore().getState().i18n;
    if (initial) {
      i18n.load(initial.messages);
      i18n.activate(initial.locale);
    }
    return i18n;
  });
  return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
};
