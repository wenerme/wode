import { polyfillCrypto } from './polyfillCrypto';
import { polyfillFetch } from './polyfillFetch';
import { polyfillJsDom } from './polyfillJsDom';

export async function polyfillBrowser() {
  await polyfillCrypto();
  await polyfillFetch();
  await polyfillJsDom();
}
