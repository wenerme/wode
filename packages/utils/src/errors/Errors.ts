import { getHttpStatusText } from '../http/HttpStatus';

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

export class Errors {
  static BadRequest: ErrorDetail = this.with({ status: 400 });
  static Unauthorized: ErrorDetail = this.with({ status: 403 });
  static Forbidden: ErrorDetail = this.with({ status: 403 });
  static NotFound: ErrorDetail = this.with({ status: 404 });
  static InternalServerError: ErrorDetail = this.with({ status: 500 });
  static NotImplemented: ErrorDetail = this.with({ status: 501 });
  static ServiceUnavailable: ErrorDetail = this.with({ status: 503 });

  static resolvers: ((e: any) => ErrorDetail | void)[] = [];

  static with(init: ErrorDetailInit): ErrorDetail {
    return new DetailHolder(init);
  }

  static ok(res: Response, o?: Partial<ErrorDetailInit>) {
    if (res.ok) {
      return res;
    }
    throw this.with({
      description: res.statusText,
      status: res.status,
      ...o,
      metadata: {
        ...o?.metadata,
        response: res,
      },
    }).asError();
  }

  static resolve(e: any): ErrorDetail {
    if (e instanceof DetailHolder) {
      return e;
    }

    if (e instanceof DetailError) {
      return e.detail;
    }

    for (const resolver of this.resolvers) {
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
