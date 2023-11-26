export {};

export class FeishuCliet {}

export function request() {}

export async function getTenantAccessTokenInternal(body: { app_id: string; app_secret: string }): Promise<{
  code: number;
  msg: string;
  tenant_access_token: string;
  expire: number;
}> {
  const res = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return await res.json();
}

export async function getAppAccessTokenInternal(body: { app_id: string; app_secret: string }): Promise<{
  code: number;
  msg: string;
  app_access_token: string;
  expire: number;
}> {
  const res = await fetch('https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return await res.json();
}
