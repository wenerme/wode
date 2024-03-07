'use server';

import dayjs from 'dayjs';
import { LoginFormData } from '../web/pages';

export async function doPasswordLogin(o: LoginFormData) {
  if (o.username === 'admin' && o.password === 'admin') {
    return {
      accessToken: `TOKEN`,
      refreshToken: 'REFRESH',
      expiresIn: 7200,
      expiresAt: dayjs().add(7200, 'second').toDate().toJSON(),
    };
  }

  throw new Error('用户名或密码错误');
}

export async function doRefreshToken(o: { accessToken: string; refreshToken?: string }) {
  if (o.refreshToken === 'REFRESH') {
    return {
      accessToken: 'TOKEN',
      refreshToken: 'REFRESH',
      expiresIn: 7200,
      expiresAt: dayjs().add(7200, 'second').toDate().toJSON(),
    };
  }

  throw new Error('刷新令牌无效');
}

export async function doPing() {
  return {
    ok: true,
  };
}
