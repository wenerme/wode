import { getHttpStatusText } from '../fetch/HttpStatus';

export interface ErrorDetailInit {
  message?: string;
  status: number;
  description?: string;
  code?: number | string;
  metadata?: Record<string, any>;
  cause?: any;
}

export class DetailError extends Error {
  readonly status: number;
  readonly description?: string;

  constructor(readonly detail: ErrorDetail) {
    super(detail.message, {
      cause: detail.cause,
    });
    this.status = detail.status;
    this.description = detail.description;
  }

  toJSON() {
    return {
      code: this.detail.code,
      message: this.message,
      status: this.status,
      description: this.description,
      cause: this.cause,
    };
  }
}

class DetailHolder implements ErrorDetail {
  readonly message: string;
  readonly status: number;
  readonly code: number | string;
  readonly metadata?: Record<string, any>;
  readonly description?: string;
  readonly cause?: any;

  constructor({
    status,
    message = getHttpStatusText(status),
    code = status,
    metadata,
    description,
    cause,
  }: ErrorDetailInit) {
    this.message = message ?? String(status);
    this.status = status;
    this.code = code;
    this.description = description;
    this.metadata = metadata;
    this.cause = cause;
  }

  with(o?: Partial<ErrorDetailInit> | string): DetailHolder {
    if (typeof o === 'string') {
      o = { message: o };
    }

    if (o === undefined) {
      return new DetailHolder(this);
    }

    return new DetailHolder({
      status: this.status,
      code: this.code,
      message: this.message,
      metadata: this.metadata,
      cause: this.cause,
      ...o,
    });
  }

  asError(o?: Partial<ErrorDetailInit> | string): Error {
    if (typeof o === 'string') {
      o = { message: o };
    }

    return new DetailError(this.with(o));
  }

  require(v: any, o?: Partial<ErrorDetailInit> | string): any {
    if (v === undefined || v === null) {
      throw this.asError(o);
    }

    return v;
  }

  check(cond: any, o?: Partial<ErrorDetailInit> | string) {
    switch (cond) {
      case false:
      case undefined:
      case null: {
        throw this.asError(o);
      }
    }
  }

  throw(o?: string | Partial<ErrorDetailInit>): never {
    throw this.asError(o);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      status: this.status,
      description: this.description,
      cause: this.cause,
      metadata: this.metadata,
    };
  }

  asResponse(): Response {
    return new Response(JSON.stringify(this.toJSON()), {
      status: this.status,
      statusText: this.description,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export interface ErrorDetail {
  readonly message: string;
  readonly status: number;
  readonly code?: number | string;
  readonly metadata?: Record<string, any>;
  readonly description?: string;
  readonly cause?: any;

  with(message: string): ErrorDetail;

  with(o?: Partial<ErrorDetailInit>): ErrorDetail;

  asError(o?: string | Partial<ErrorDetailInit>): Error;

  asResponse(): Response;

  throw(o?: string | Partial<ErrorDetailInit>): never;

  require<T>(v: T | undefined, o?: Partial<ErrorDetailInit> | string): NonNullable<T>;

  check(condition: boolean, o?: Partial<ErrorDetailInit> | string): asserts condition;

  check<T>(v: T | undefined | null, o?: Partial<ErrorDetailInit> | string): asserts v is NonNullable<T>;
}

export namespace Errors {
  /*
https://github.com/tc39/proposal-error-cause
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause
Stage 3
Chrome 93, Safari 15, Node 16.9

https://www.npmjs.com/package/pony-cause
   */

  export const BadRequest: ErrorDetail = create({ status: 400 });
  export const Unauthorized: ErrorDetail = create({ status: 403 });
  export const Forbidden: ErrorDetail = create({ status: 403 });
  export const NotFound: ErrorDetail = create({ status: 404 });
  export const InternalServerError: ErrorDetail = create({ status: 500 });
  export const NotImplemented: ErrorDetail = create({ status: 501 });
  export const ServiceUnavailable: ErrorDetail = create({ status: 503 });

  // known errors
  // TypeError  when an operation could not be performed, typically (but not exclusively) when a value is not of the expected type.
  // RangeError  when a number is not within the correct range allowed.
  // AggregateError  when multiple errors need to be reported by an operation, for example by Promise.all().
  //  例如 Promise.any() 会返回一个 AggregateError，其中包含所有 rejected 的 Promise 的错误。
  // EvalError  when an error occurs during the evaluation of JavaScript code.
  // ReferenceError  when a non-existent variable is referenced.
  // SyntaxError  when a syntax error occurs while parsing code in eval().
  // URIError  when encodeURI() or decodeURI() are passed invalid parameters.
  // InternalError  when an internal error in the JavaScript engine is thrown. E.g. "too much recursion".
  // DOMException  when an error occurs in the DOM.

  export const resolvers: ((e: any) => ErrorDetail | void)[] = [];

  export function create(init: ErrorDetailInit): ErrorDetail {
    return new DetailHolder(init);
  }

  export function ok(res: Response, o?: Partial<ErrorDetailInit>) {
    if (res.ok) {
      return res;
    }
    throw create({
      description: res.statusText,
      status: res.status,
      ...o,
      metadata: {
        ...o?.metadata,
        response: res,
      },
    }).asError();
  }

  export function resolve(e: any): ErrorDetail {
    if (e instanceof DetailHolder) {
      return e;
    }

    if (e instanceof DetailError) {
      return e.detail;
    }

    for (const resolver of resolvers) {
      const r = resolver(e);
      if (r) {
        return r;
      }
    }

    if (e instanceof Error) {
      const { message, code, status } = e as any;
      // can get status from NestJS HttpException
      return new DetailHolder({
        message,
        status: parseInt(status) || 500,
        code,
        cause: e,
      });
    }

    return new DetailHolder({
      message: e.message,
      status: 500,
      cause: e,
    });
  }
}

// interface ZodError {
//   path: Array<string | number>;
//   message: string;
//   code: string;
//   expected?: any;
//   received?: any;
// }
