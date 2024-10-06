type StatusCode = number;
type HeaderRecord = Record<string, string | string[]>;
type Data = string | ArrayBuffer | ReadableStream;

class ResponseHelper {
  json(data: any, arg?: StatusCode | ResponseInit, headers?: HeaderRecord) {
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
  }

  redirect(location: string, status: StatusCode = 302) {
    return this.of(null, {
      status,
      headers: {
        Location: location,
      },
    });
  }

  of(data: Data | null | Response, arg?: StatusCode | ResponseInit, headers?: HeaderRecord): Response {
    if (data instanceof Response) {
      return data;
    }
    let init: ResponseInit;
    if (typeof arg === 'number') {
      init = {
        status: arg,
      };
    } else {
      init = arg || {};
    }
    if (headers) {
      const hdr = Array.from(new Headers(init.headers).entries());
      for (const [k, v] of Object.entries(headers)) {
        if (Array.isArray(v)) {
          v.forEach((v) => hdr.push([k, v]));
        } else {
          hdr.push([k, v]);
        }
      }
      init.headers = hdr;
    }
    return new Response(data, init);
  }
}

function merge(a?: StatusCode | ResponseInit, b?: StatusCode | ResponseInit) {
  const ia = typeof a === 'number' ? { status: a } : a || {};
  const ib = typeof b === 'number' ? { status: b } : b || {};
  return {
    ...ia,
    ...ib,
    headers: {
      ...ia.headers,
      ...ib.headers,
    },
  };
}

export const Responses = new ResponseHelper();
