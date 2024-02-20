import { FetchLike } from '@wener/utils';
import { requestFromSession } from './requestFromSession';
import { GetLoginSessionResponse } from './types';

export function getLoginSession({ fetch, cookie }: { fetch?: FetchLike; cookie: string }) {
  return requestFromSession<GetLoginSessionResponse>({
    url: `https://17dz.com/xqy-portal-web/activity/activity/login/getLoginSession`,
    cookie,
    fetch,
  });
}
