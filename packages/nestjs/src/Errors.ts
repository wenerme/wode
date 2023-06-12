import { HttpException } from '@nestjs/common';

export interface ErrorDetailInit {
  message: string;
  status: number;
  description?: string;
  code?: number;
  data?: any;
}

class ErrorDetailException extends HttpException {
  constructor(readonly detail: ErrorDetail & { cause?: any }) {
    super(detail.message, detail.status, {
      cause: detail.cause,
      description: detail.description,
    });
  }
}

class ErrorDetailHolder implements ErrorDetail {
  readonly message: string;
  readonly status: number;
  readonly code: number;
  readonly data?: any;
  readonly description?: string;

  constructor({ message, status, code = status, data, description }: ErrorDetailInit) {
    this.message = message;
    this.status = status;
    this.code = code;
    this.description = description;
    this.data = data;
  }

  with(o?: Partial<ErrorDetailInit> | string): ErrorDetailHolder {
    if (typeof o === 'string') {
      o = { message: o };
    }
    if (o === undefined) {
      return new ErrorDetailHolder(this);
    }
    return new ErrorDetailHolder({
      status: this.status,
      code: this.code,
      message: this.message,
      data: this.data,
      ...o,
    });
  }

  asException(o?: Partial<ErrorDetailInit & { cause?: any }> | string): Error {
    if (typeof o === 'string') {
      o = { message: o };
    }
    const detail = this.with(o);
    if (o?.cause) {
      (detail as any).cause = o.cause;
    }
    return new ErrorDetailException(detail);
  }

  require<T>(v: T | undefined | null, message?: string): T {
    if (v === undefined || v === null) {
      throw this.asException({ message });
    }
    return v;
  }

  check(cond: any, message?: string) {
    switch (cond) {
      case false:
      case undefined:
      case null:
        throw this.asException({ message });
    }
  }
}

export interface ErrorDetail {
  readonly message: string;
  readonly status: number;
  readonly code?: number | string;
  readonly data?: any;
  readonly description?: string;

  with(message: string): ErrorDetail;

  with(o?: Partial<ErrorDetailInit>): ErrorDetail;

  asException(o?: Partial<ErrorDetailInit & { cause?: any }>): Error;

  asException(message: string): Error;

  require<T>(v: T | undefined | null, message?: string): T;

  check(condition: boolean, message?: string): asserts condition is true;

  check<T extends object>(v: T | undefined | null, message?: string): asserts v is T;
}

export class Errors {
  static BadRequest: ErrorDetail = this.with({ message: '错误的请求', status: 400 });
  static Unauthorized: ErrorDetail = this.with({ message: '未授权访问', status: 403 });
  static Forbidden: ErrorDetail = this.with({ message: '拒绝访问', status: 403 });
  static NotFound: ErrorDetail = this.with({ message: '资源未找到', status: 404 });
  static InternalServerError: ErrorDetail = this.with({ message: '服务内部错误', status: 501 });
  static NotImplemented: ErrorDetail = this.with({ message: '操作未实现', status: 501 });
  static ServiceUnavailable: ErrorDetail = this.with({ message: '服务不可用', status: 503 });

  static with(init: ErrorDetailInit): ErrorDetail {
    return new ErrorDetailHolder(init);
  }
}

interface ZodError {
  path: (string | number)[];
  message: string;
  code: string;
  expected?: any;
  received?: any;
}
