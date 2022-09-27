import { polyfillFetch } from '../../loaders/polyfillFetch';
import { polyfillJsDom } from './polyfillJsDom';

export async function browserEnv() {
  await polyfillFetch();
  if (typeof globalThis === 'undefined') {
    throw new Error('globalThis is not defined');
  }

  if (typeof window !== 'undefined') {
    return window;
  }
  try {
    return await polyfillJsDom();
  } catch (e) {
    console.error(e);
    throw e;
  }
}
