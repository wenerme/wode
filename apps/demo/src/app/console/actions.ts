'use server';

import { LoginFormData } from '@wener/console/pages';
import { sleep } from '@wener/utils';

export async function doPasswordLogin(o: LoginFormData) {
  console.log(`Logging`, o);
  await sleep(1000);
  return {
    message: '登录成功',
  };
}
