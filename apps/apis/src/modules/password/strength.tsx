import { PageErrorState } from 'common/src/components';
import React from 'react';
import ZxcvbnPasswordStrength from './zxcvbn/ZxcvbnPasswordStrength';
import { RouteObject } from 'react-router-dom';
import { getOpenApiUrl } from '../../app/dash/settings';

const route = {
  element: <ZxcvbnPasswordStrength />,
  errorElement: <PageErrorState />,
  action: ({ params: { password = '123456789' } }) => {
    return fetch(getOpenApiUrl('/password/zxcvbn', {
      params: {
        password: password || '123456',
      },
    })).then(v => v.json());
  },
  loader: ({ request, params }) => {
    return fetch(getOpenApiUrl('/password/zxcvbn', {
      params: {
        password: params.password || new URL(request.url).searchParams.get('password') || '123456',
      },
    })).then(v => v.json());
  },
} as RouteObject;

export default route;
