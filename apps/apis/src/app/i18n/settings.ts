export const fallbackLng = 'zh-CN';
export const languages = [fallbackLng, 'en-US'];

export const defaultNS = 'translation';

export function getOptions(lng = fallbackLng, ns = defaultNS) {
  return {
    debug: process.env.NODE_ENV === 'development',
    supportedLngs: languages,
    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns,
  };
}
