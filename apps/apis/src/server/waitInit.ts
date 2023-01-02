import { createLazyPromise } from '@wener/utils';
import { polyfillCrypto, polyfillFetch } from '@wener/utils/server';
import { getSequelize } from './db/sequelize';

const _init = createLazyPromise(async () => {
  await polyfillCrypto();
  await polyfillFetch();
  await getSequelize();
  return true;
});

export function waitInit() {
  return _init;
}
