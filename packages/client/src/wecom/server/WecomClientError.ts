/**
 * @see https://developer.work.weixin.qq.com/document/path/90313
 */
export class WecomClientError extends Error {
  readonly code: number;
  readonly status?: number;
  readonly body?: number;

  constructor(
    { message, code, status, body }: { message: string; code: number; status?: number; body?: number },
    public options?: ErrorOptions,
  ) {
    super(message, options);
    this.code = code;
    this.status = status;
    this.body = body;
  }

  static async ok(res: Response) {
    let body;
    let last;
    try {
      const type = res.headers.get('content-type');
      if (type?.includes('application/json')) {
        body = await res.json();
      } else if (type?.includes('text/')) {
        body = await res.text();
      } else {
        body = res.body;
      }
    } catch (error) {
      last = error;
    }

    if (last) {
      throw last;
    }

    if (res.status >= 400 || body?.errcode) {
      let err: Error;
      if (typeof body === 'object' && body) {
        err = new WecomClientError({
          message: body.errmsg,
          code: body.errcode,
          status: res.status,
          body,
        });
      } else {
        err = Object.assign(new Error(res.statusText), {
          status: res.status,
          body,
        });
      }

      throw err;
    }

    return body;
  }
}
