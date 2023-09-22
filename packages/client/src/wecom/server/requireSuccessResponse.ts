export async function requireSuccessResponse(r: Response) {
  let body;
  try {
    const type = r.headers.get('content-type');
    if (type?.includes('application/json')) {
      body = await r.json();
    } else if (type?.includes('text/')) {
      body = await r.text();
    } else {
      body = r.body;
    }
  } catch (e) {}
  if (r.status >= 400 || body?.errcode) {
    throw Object.assign(new Error(body?.errmsg || r.statusText, { cause: r }), {
      code: body?.errcode,
      status: r.status,
      body,
    });
  }
  return body as any;
}

export interface ErrorResponse extends Error {
  code: string;
  status: number;
  body?: string;
  cause: Response;
}

// interface ErrorBody {
//   errcode: number;
//   errmsg: string;
// }
