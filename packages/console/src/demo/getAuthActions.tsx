import dayjs from 'dayjs';
import { LoginFormData } from '../console/pages';

export const doPasswordLogin = async ({ username, password }: LoginFormData) => {
  if (username !== 'admin' || password !== 'admin') {
    throw new Error('用户名或密码错误');
  }
  return {
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
    expiresIn: 7200,
    expiresAt: dayjs().add(7200, 'second').toDate(),
  };
};

interface AccessTokenObject {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date | string;
  expiresIn: number;
}

interface AuthActions {
  signInByPassword: (data: { username: string; password: string }) => Promise<AccessTokenObject>;
  signOut: () => Promise<any>;
}

export function getAuthActions(): AuthActions {
  return {
    signInByPassword: async (data) => {
      return doPasswordLogin(data);
    },
    signOut: async () => {},
  };
}
