import { get } from '../objects/get';
import type { ObjectPathLike } from '../objects/parseObjectPath';
import { renderTemplate } from '../strings/renderTemplate';

export interface Translate<T extends object> {
  /** Get/Set the language key */
  locale(lang?: string): string;

  /** Define the dict of translations for a language */
  dict(lang: string, dict: T): void;

  /** Get the dict of translations for a language */
  dict(lang: string): T;

  /** Retrieve a translation segment for the current language */
  t<X extends Record<string, any> | any[]>(key: ObjectPathLike, params?: X, lang?: string): string;
}

export function createTranslate<T extends object>(obj?: Record<string, T>): Translate<T> {
  let locale = '';
  const tree = obj || {};

  return {
    locale(lang) {
      return (locale = lang || locale);
    },

    dict: ((lang, dict?) => {
      if (dict) {
        tree[lang] = Object.assign(tree[lang] || {}, dict);
        return;
      }
      return tree[lang];
    }) as Translate<T>['dict'],

    t(key, params, lang) {
      const val = get(tree[lang || locale], key, '') as any;
      if (process.env.NODE_ENV === 'development') {
        if (val == null) {
          return console.error(
            `[Translate] Missing the "${[].concat(key as any).join('.')}" key within the "${
              lang || locale
            }" dictionary`,
          );
        }
      }
      if (typeof val === 'function') return val(params);
      if (typeof val === 'string') return renderTemplate(val, params, 'common');
      return val;
    },
  };
}
