import type { FetchLike } from '@wener/utils';
import { requestFromSession } from './requestFromSession';
import type { GetLoginSessionResponse } from './types';

export async function getLoginSession({ fetch, cookie }: { fetch?: FetchLike; cookie: string }) {
  return requestFromSession<GetLoginSessionResponse>({
    url: 'https://17dz.com/xqy-portal-web/activity/activity/login/getLoginSession',
    cookie,
    fetch,
  });
}
