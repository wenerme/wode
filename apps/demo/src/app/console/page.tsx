'use client';

import { getUserAction } from '@wener/console/console/user';
import { LoginFormData } from '@wener/console/pages';
import { showErrorToast, showSuccessToast } from '@wener/console/toast';
import dynamic from 'next/dynamic';
import { Authenticated } from '../../client/console/Authenticated';
import { doPasswordLogin } from './actions';

const Content = dynamic(() => import('../../client/console/ConsoleApp'), {
  ssr: false,
});
export default function () {
  const doLogin = async (o: LoginFormData) => {
    try {
      const { message } = await doPasswordLogin(o);
      await getUserAction().signIn();
      showSuccessToast(message);
    } catch (e) {
      showErrorToast(e);
    }
  };
  return (
    <Authenticated onLogin={doLogin}>
      <Content />
    </Authenticated>
  );
}
