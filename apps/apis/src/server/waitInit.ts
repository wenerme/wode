import { createLazyPromise } from '@wener/utils';
import { polyfillCrypto } from '@wener/utils/server';
import { getSequelize } from './db/sequelize';

const _init = createLazyPromise(async () => {
  await polyfillCrypto();
  await getSequelize();
  return true;
});

export function waitInit() {
  return _init;
}
