import type { AllMessages, Messages } from '@lingui/core';
import type { MaybePromise } from '@wener/utils';
import { getLocales } from './getLocales';
import { resolveLocale } from './resolveLocale';

let messages: AllMessages = {};
export function loadMessage(locale?: string): MaybePromise<Messages> {
  ({ locale } = resolveLocale(locale));
  if (messages[locale]) {
    return messages[locale];
  }
  // return (await import(`@/locales/${locale}/messages.ts`)).messages;
  return Promise.resolve().then(async () => {
    switch (locale) {
      case 'en':
        messages[locale] = (await import(`@/locales/en/messages.mjs`)).messages;
        break;
      default:
      case 'zh-CN':
        messages[locale] = (await import(`@/locales/zh-CN/messages.mjs`)).messages;
        break;
    }
    return messages[locale];
  });
}

export async function loadAllMessages(): Promise<AllMessages> {
  const { locales } = getLocales();
  return Object.fromEntries(await Promise.all(locales.map(async (v) => [v, await loadMessage(v)])));
}
