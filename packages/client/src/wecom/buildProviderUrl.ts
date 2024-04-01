// https://developer.work.weixin.qq.com/document/path/90597
import { getRedirectUri } from '../wechat/getRedirectUri';

export function buildAppInstallUrl({
  redirect_uri = getRedirectUri(),
  ...opts
}: {
  suite_id: string;
  pre_auth_code: string;
  redirect_uri?: string;
  state?: string;
}) {
  const u = new URL('https://open.work.weixin.qq.com/3rdapp/install');
  for (const v of Object.entries({
    redirect_uri,
    ...opts,
  }).filter((v) => v[1])) {
    u.searchParams.append(v[0], String(v[1]));
  }

  // callback with auth code
  // redirect_uri?auth_code=xxx&expires_in=600&state=xx
  return u.toString();
}
