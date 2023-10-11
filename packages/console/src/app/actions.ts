'use server';

import { sleep } from '@wener/utils';
import { LoginFormData } from '../components/console/pages/LoginPage';

export async function doPasswordLogin(o: LoginFormData) {
  console.log(`Logging`, o);
  await sleep(1000);
  return {
    message: '登录成功',
  };
}
