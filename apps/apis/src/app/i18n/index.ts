import { UseTranslationOptions } from 'react-i18next';
import { i18n, KeyPrefix, Namespace, TFunction } from 'i18next';
import { defaultNS, fallbackLng } from './settings';

export type UseTranslation = <N extends Namespace, TKPrefix extends KeyPrefix<N> = undefined>(
  lng?: string,
  ns?: N | Readonly<N>,
  options?: UseTranslationOptions<TKPrefix>,
) => {
  t: TFunction<N, TKPrefix>;
  i18n: i18n;
};

export let useTranslation: UseTranslation = (...args) => {
  const [lang = fallbackLng, ns = defaultNS] = args;
  let key = `${lang}/${ns}`;
  const f = translations[key] || translations[`${fallbackLng}/${defaultNS}`];
  if (!f) {
    throw new Error(`UseTranslation for ${key} is not ready`);
  }
  return f(...args);
};

export function withTranslation(f: UseTranslation, lang: string = fallbackLng, ns: string = defaultNS) {
  translations[`${lang}/${ns}`] = f;
}

const translations: Record<string, UseTranslation> = {};
