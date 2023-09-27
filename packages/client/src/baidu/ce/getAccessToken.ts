import { Errors, FetchLike, getGlobalThis } from '@wener/utils';

export async function getAccessToken({
  fetch = getGlobalThis().fetch,
  clientId,
  clientSecret,
}: {
  fetch?: FetchLike;
  clientId: string;
  clientSecret: string;
}) {
  Errors.BadRequest.check(clientId && clientSecret, 'Missing clientId or clientSecret');
  // https://cloud.baidu.com/doc/WENXINWORKSHOP/s/Ilkkrb0i5
  // 默认有效期30天
  let u = new URL('https://aip.baidubce.com/oauth/2.0/token');
  u.searchParams.set('grant_type', 'client_credentials');
  u.searchParams.set('client_id', clientId!);
  u.searchParams.set('client_secret', clientSecret!);
  const res = await fetch(u.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const payload = await requireResOk(res);
  const out = payload as GetTokenPayload;
  out.expires_at = new Date(Date.now() + out.expires_in * 1000);
  return out;
}

async function requireResOk(res: Response) {
  let cause;
  let payload: unknown;

  if (res.headers.get('content-type')?.includes('json')) {
    try {
      payload = await res.json();
    } catch (e) {
      cause = e;
    }
  }

  if (cause && !payload) {
    // delay res status check
    Errors.ServiceUnavailable.check(res.ok, `Failed to get token ${res.status} ${res.statusText}`);
    // ok with unexpected resource
    throw Errors.ServiceUnavailable.asError({
      message: `Failed to get token payload: ${res.headers.get('content-type')})}`,
      cause: cause,
    });
  }

  if (payload) {
    const e = payload as ErrorResponsePayload;
    if (e.error_code) {
      throw Errors.ServiceUnavailable.asError({
        message: `(${e.error_code}) ${e.error_msg}`,
        description: e.error_msg,
        code: e.error_code,
        metadata: {
          payload,
        },
      });
    }
    if (e.error) {
      throw Errors.ServiceUnavailable.asError({
        message: `(${e.error}) ${e.error_description}`,
        description: e.error_description,
        code: e.error,
        metadata: {
          payload,
        },
      });
    }
  }

  return payload;
}

export interface GetTokenPayload {
  refresh_token: string;
  expires_in: number;
  session_key: string;
  access_token: string;
  scope: string; // "ai_custom_yiyan_com_eb_instant license_license ai_custom_retail_image_stitch easydl_pro_job xxxxx"
  session_secret: string;
  expires_at: Date;
}

interface ErrorResponsePayload {
  // common
  error: string;
  error_description: string;

  // for qianfan
  error_code: number;
  error_msg: string;
}
