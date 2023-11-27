import { Value } from '@sinclair/typebox/value';
import { classOf, Errors, FetchLike, getGlobalThis, isUUID } from '@wener/utils';
import { getEntityManager } from '../../app/mikro-orm';
import { AccessTokenEntity } from '../../entity/AccessTokenEntity';
import { OpenAiClientAgent } from './OpenAiClientAgent';
import { parseAuthorization } from './parseAuthorization';

export async function proxyOpenAi({
  debug: isDev,
  request: req,
  body = req.body,
  headers: hdr1 = Object.fromEntries(req.headers.entries()),
  fetch = getGlobalThis().fetch,
}: {
  debug?: boolean;
  request: Request;
  body?: any;
  headers?: Record<string, any>;
  fetch?: FetchLike;
}) {
  const url = new URL(req.url);
  url.protocol = 'https:';
  url.host = 'api.openai.com';
  url.port = '';

  let authorization = hdr1.authorization;
  let isSecretKey = false;
  let headers: Record<string, any> = Object.fromEntries(
    Object.entries(hdr1).filter(([k]) => {
      // openai-beta
      // openai-organization
      if (k.startsWith('openai-')) {
        return true;
      }
      switch (k) {
        case 'authorization':
        case 'user-agent':
        case 'content-type':
        case 'accept':
          return true;
      }
    }),
  );
  if (body instanceof FormData) {
    delete headers['content-type'];
  }

  {
    let [type, token] = parseAuthorization(authorization);
    switch (type?.toLowerCase()) {
      case 'basic':
        if (token) {
          let [_, password] = btoa(token).split(':');
          token = password;
        }
        break;
      case 'bearer':
        break;
    }

    if (token && (isUUID(token) || (token?.startsWith('sk-') && isUUID(token?.substring(3))))) {
      // allow sk- prefix
      // some client will detect sk-
      if (token.startsWith('sk-')) {
        token = token.slice(3);
      }
      let repo = getEntityManager().getRepository(AccessTokenEntity);
      let at = await repo.findOne(
        {
          $and: [
            {
              accessToken: token,
              clientAgent: {
                type: 'OpenAi',
                active: true,
              },
            },
            {
              $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }],
            },
          ],
        },
        {
          populate: ['clientAgent'],
          cache: 1000 * 60,
        },
      );
      let ca = at?.clientAgent;
      if (!at || !ca) {
        return Errors.Unauthorized.with('Invalid Token').asResponse();
      }
      if (!Value.Check(OpenAiClientAgent, ca)) {
        return Errors.BadRequest.with('Invalid Client Agent').asResponse();
      }

      headers.authorization = `Bearer ${ca.secrets.key}`;
      headers['openai-organization'] ||= ca.secrets.organization;
    } else if (token?.startsWith('sk-')) {
      isSecretKey = true;
    }
  }

  // rm falsy headers
  headers = Object.fromEntries(Object.entries(headers).filter(([_, v]) => v));
  if (isDev) {
    console.log(`> ${url}`);
    console.log(
      `-> ${req.method} ${url.pathname}${url.search} ${classOf(body)} ${(body?.length ?? body?.byteLength) || 'N/A'}`,
    );
    console.log(hdr1);

    if (body instanceof FormData) {
      for (let [k, v] of body.entries()) {
        console.log(`  ${k} = ${v}`);
      }
    }
    // if (body instanceof ArrayBuffer) {
    //   console.log(ArrayBuffers.toString(body));
    // }
  }
  let res: Response;
  try {
    res = await fetch(url, {
      headers,
      body: body as any,
      method: req.method,
      verbose: isDev,
    } as RequestInit);
  } catch (e) {
    console.error(`Proxy Error`, e);
    return new Response(JSON.stringify({ status: 500, message: 'proxy failed' }), {
      status: 500,
      headers: {
        'content-type': 'application/json',
      },
    });
  }

  if (isDev) {
    console.log(`<- ${req.method} ${url.pathname} ${res.status} ${res.statusText}`);
  }

  let down = {
    ...Object.fromEntries(
      Array.from(res.headers.entries()).filter(([k]) => {
        switch (k) {
          case 'content-type':
          case 'x-request-id':
            return true;
        }

        if (isSecretKey) {
          if (k.startsWith('openai-') || k.startsWith('x-ratelimit-')) {
            return true;
          }
        }
      }),
    ),
    'cache-control': 'no-cache, must-revalidate',
  };

  return new Response(res.body, {
    status: res.status,
    headers: down,
  });
}
