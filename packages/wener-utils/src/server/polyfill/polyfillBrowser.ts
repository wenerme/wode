import { polyfillCrypto } from './polyfillCrypto';
import { polyfillFetch } from './polyfillFetch';
import { polyfillJsDom } from './polyfillJsDom';

/**
 * Polyfills the browser environment with the necessary APIs for the server.
 * Currently, this includes:
 * - `window`
 * - `document`
 * - `fetch`
 * - `crypto`
 */
export async function polyfillBrowser() {
  await polyfillCrypto();
  await polyfillFetch();
  await polyfillJsDom();
}
