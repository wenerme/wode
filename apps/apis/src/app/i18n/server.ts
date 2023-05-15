import { UseTranslationOptions } from 'react-i18next';
import { initReactI18next } from 'react-i18next/initReactI18next';
import { createInstance, KeyPrefix, Namespace } from 'i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { getOptions } from './settings';

const initI18next = async (lng: string, ns: any) => {
  const i18nInstance = createInstance();
  await i18nInstance
    .use(initReactI18next)
    .use(resourcesToBackend((language: string, namespace: string) => import(`./locales/${language}/${namespace}.json`)))
    .init(getOptions(lng, ns));
  return i18nInstance;
};

export async function useTranslation<N extends Namespace, TKPrefix extends KeyPrefix<N> = undefined>(
  lng: string,
  ns?: N | Readonly<N>,
  options?: UseTranslationOptions<TKPrefix>,
) {
  const i18nextInstance = await initI18next(lng, ns);
  return {
    t: (i18nextInstance as any).getFixedT(lng, Array.isArray(ns) ? ns[0] : ns, options),
    i18n: i18nextInstance,
  };
}

// const getI18n = unstable_cache(async (lng: string,ns?:string,options?:any)=>{
//   const i18nextInstance = await initI18next(lng, ns);
//   return {
//     t: (i18nextInstance as any).getFixedT(lng, Array.isArray(ns) ? ns[0] : ns, options),
//     i18n: i18nextInstance,
//   };
// })

// https://locize.com/blog/next-13-app-dir-i18n/
