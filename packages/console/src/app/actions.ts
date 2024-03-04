'use server';

import { sleep } from '@wener/utils';
import { LoginFormData } from '../web/pages';

export async function doPasswordLogin(o: LoginFormData) {
  console.log(`Logging`, o);
  await sleep(1000);
  return {
    message: '登录成功',
  };
}
