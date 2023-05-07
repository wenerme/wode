import { PageErrorState } from 'common/src/components';
import { getTrpcProxyClient } from '../../utils/trpc';
import React from 'react';
import ZxcvbnPasswordStrength from './zxcvbn/ZxcvbnPasswordStrength';
import { RouteObject } from 'react-router-dom';

const route = {
  element: <ZxcvbnPasswordStrength />,
  errorElement: <PageErrorState />,
  action: ({ params: { password = '123456789' } }) => {
    return getTrpcProxyClient().password.zxcvbn.query({ password });
  },
  loader: ({ request }) => {
    return getTrpcProxyClient().password.zxcvbn.query({
      password: new URL(request.url).searchParams.get('password') || '123456',
    });
  },
} as RouteObject;

export default route;
