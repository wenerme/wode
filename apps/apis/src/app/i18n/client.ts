'use client';

import { initReactI18next, useTranslation as useTranslationOrg, UseTranslationOptions } from 'react-i18next';
import i18next, { KeyPrefix, Namespace } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';
import { getOptions } from './settings';

//
i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(resourcesToBackend((language: string, namespace: string) => import(`./locales/${language}/${namespace}.json`)))
  .init({
    ...getOptions(),
    lng: undefined, // let detect the language on client side
    detection: {
      order: ['path', 'htmlTag', 'cookie', 'navigator'],
    },
  });

export function useTranslation<N extends Namespace, TKPrefix extends KeyPrefix<N> = undefined>(
  lng: string,
  ns?: N | Readonly<N>,
  options?: UseTranslationOptions<TKPrefix>,
) {
  if (i18next.resolvedLanguage !== lng) i18next.changeLanguage(lng);
  return useTranslationOrg(ns, options);
}
