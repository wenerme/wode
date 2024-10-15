import { i18n, type AllMessages, type Messages } from '@lingui/core';
import { getI18n, setI18n } from '@lingui/react/server';
import { resolveLocale } from '@/i18n/resolveLocale';

async function loadMessage(locale?: string): Promise<Messages> {
  ({ locale } = resolveLocale(locale));
  // return (await import(`@/locales/${locale}/messages.ts`)).messages;
  let messages;
  switch (locale) {
    case 'en':
      messages = (await import(`@/locales/en/messages.mjs`)).messages;
      break;
    default:
    case 'zh-CN':
      messages = (await import(`@/locales/zh-CN/messages.mjs`)).messages;
      break;
  }
  return messages;
}

async function loadAll(): Promise<AllMessages> {
  const { locales } = resolveLocale();
  return Object.fromEntries(await Promise.all(locales.map(async (v) => [v, await loadMessage(v)])));
}

const _all: Record<string, () => any> = {};

export async function loadI18n({ lang, source = 'N/A' }: { lang?: string; source?: string }) {
  const { locale, locales } = resolveLocale(lang);
  if (locale && _all[locale]) {
    console.log(`[loadI18n] reset for ${source} ${locale}`);
    return _all[locale]();
  }
  try {
    let i18n = getI18n()?.i18n;
    if (i18n) {
      console.log(`[loadI18n] reuse`);
      return {
        locale: i18n.locale,
        messages: i18n.messages,
      };
    }
  } catch (e) {
    console.error(`[loadI18n] getI18n`, String(e));
  }
  let all = await loadAll();
  i18n.load(all);
  i18n.activate(locale, locales);
  setI18n(i18n);

  console.log(`[loadI18n] from ${source} load`, locale);

  _all[locale] ||= () => {
    i18n.load(all);
    i18n.activate(locale, locales);
    setI18n(i18n);

    return {
      locale,
      messages: i18n.messages,
    };
  };

  return {
    locale,
    messages: i18n.messages,
  };
}
