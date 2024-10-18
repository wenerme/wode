import { i18n, setupI18n, type I18n } from '@lingui/core';
import { setI18n } from '@lingui/react/server';
import { mutative } from '@wener/reaction/mutative/zustand';
import { createStore } from 'zustand';
import { getContextStates } from '@/components/getContextStates';
import { loadMessage } from '@/i18n/loadMessage';
import { resolveCurrentLocale } from '@/i18n/resolveCurrentLocale';
import { createServerContext, getServerNonce } from '@/server/createServerContext';

interface I18nStoreState {
  i18n: I18n;
  state: 'Init' | 'Loading' | 'Loaded';
}

const I18nStore = getContextStates<I18nStore>('I18nStore', () => {
  return createI18nStore();
});

type I18nStore = ReturnType<typeof createI18nStore>;

function createI18nStore() {
  return createStore(
    mutative<I18nStoreState>((setState, getState, store) => {
      return {
        i18n,
        state: 'Init',
      };
    }),
  );
}

const [_getI18n, _setI18n] = createServerContext<I18n | null>(() => null);

export async function load(opts?: { reason?: string }) {
  let i18n = _getI18n();
  const log = (msg: string) => {
    console.log(`[I18N.load] nonce=${getServerNonce()} reason=${opts?.reason || ''} ${msg}`);
  };
  if (!i18n) {
    const { locale, locales, query, cookie } = await resolveCurrentLocale();
    const messages = await loadMessage(locale);
    i18n = setupI18n({
      locale,
      locales: Array.from(locales),
      messages: {
        [locale]: messages,
      },
    });
    i18n.activate(locale);
    _setI18n(i18n);
    log(`init locale=${locale} query=${query} cookie=${cookie}`);
  } else {
    log(`reuse locale=${i18n.locale}`);
  }
  setI18n(i18n);
  // let store = getI18nStore();

  // if (store.getState().state !== 'Init') {
  //   log(`skip reinit`);
  //   setI18n(store.getState().i18n);
  //   return;
  // }
  // store.setState({ state: 'Loading' });
  //
  // try {
  //   const { locale, locales } = await resolveCurrentLocale();
  //   const messages = await loadMessage(locale);
  //   const { i18n } = store.getState();
  //
  //   i18n.loadAndActivate({
  //     locale,
  //     locales: Array.from(locales),
  //     messages,
  //   });
  //
  //   log(`init locale=${locale}`);
  //
  //   if (typeof window === 'undefined') {
  //     const { setI18n } = await import('@lingui/react/server');
  //     setI18n(i18n);
  //   }
  // } finally {
  //   store.setState({ state: 'Loaded' });
  // }

  return {
    i18n,
  };
}

export function getI18nStore() {
  return I18nStore;
}

// export async function loadI18n({ lang, source = 'N/A' }: { lang?: string; source?: string }) {
//   const { locale, locales } = resolveLocale(lang);
//   if (locale && _all[locale]) {
//     console.log(`[loadI18n] reset for ${source} ${locale}`);
//     return _all[locale]();
//   }
//   try {
//     let i18n = getI18n()?.i18n;
//     if (i18n) {
//       console.log(`[loadI18n] reuse`);
//       return {
//         locale: i18n.locale,
//         messages: i18n.messages,
//       };
//     }
//   } catch (e) {
//     console.error(`[loadI18n] getI18n`, String(e));
//   }
//   let all = await loadAllMessages();
//   i18n.load(all);
//   i18n.activate(locale, locales);
//   setI18n(i18n);
//
//   console.log(`[loadI18n] from ${source} load`, locale);
//
//   _all[locale] ||= () => {
//     i18n.load(all);
//     i18n.activate(locale, locales);
//     setI18n(i18n);
//
//     return {
//       locale,
//       messages: i18n.messages,
//     };
//   };
//
//   return {
//     locale,
//     messages: i18n.messages,
//   };
// }
