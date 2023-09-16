import { HttpException } from '@nestjs/common';
import { getHttpStatusText } from './HttpStatus';

export interface ErrorDetailInit {
  message?: string;
  status: number;
  description?: string;
  code?: number | string;
  data?: any;
  cause?: any;
}

class ErrorDetailException extends HttpException {
  constructor(readonly detail: ErrorDetail) {
    super(detail.message, detail.status, {
      cause: detail.cause,
      description: detail.description,
    });
  }
}

class ErrorDetailHolder implements ErrorDetail {
  readonly message: string;
  readonly status: number;
  readonly code: number | string;
  readonly data?: any;
  readonly description?: string;
  readonly cause?: any;

  constructor({
    status,
    message = getHttpStatusText(status),
    code = status,
    data,
    description,
    cause,
  }: ErrorDetailInit) {
    this.message = message;
    this.status = status;
    this.code = code;
    this.description = description;
    this.data = data;
    this.cause = cause;
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
      cause: this.cause,
      ...o,
    });
  }

  asException(o?: Partial<ErrorDetailInit> | string): Error {
    if (typeof o === 'string') {
      o = { message: o };
    }

    return new ErrorDetailException(this.with(o));
  }

  require(v: any, message?: string): any {
    if (v === undefined || v === null) {
      throw this.asException({ message });
    }

    return v;
  }

  check(cond: any, message?: string) {
    switch (cond) {
      case false:
      case undefined:
      case null: {
        throw this.asException({ message });
      }
    }
  }
}

export interface ErrorDetail {
  readonly message: string;
  readonly status: number;
  readonly code?: number | string;
  readonly data?: any;
  readonly description?: string;
  readonly cause?: any;

  with(message: string): ErrorDetail;

  with(o?: Partial<ErrorDetailInit>): ErrorDetail;

  asException(o?: Partial<ErrorDetailInit>): Error;

  asException(message: string): Error;

  require<T>(v: T | undefined, message?: string): NonNullable<T>;

  // 不支持 return value
  // https://stackoverflow.com/a/73252858/1870054

  check(condition: boolean, message?: string): asserts condition;

  check<T>(v: T | undefined, message?: string): asserts v is NonNullable<T>;
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

  static resolve(e: any): ErrorDetail {
    if (e instanceof ErrorDetailHolder) {
      return e;
    }

    if (e instanceof ErrorDetailException) {
      return e.detail;
    }

    if (e instanceof HttpException) {
      return new ErrorDetailHolder({
        message: e.message,
        status: e.getStatus(),
        cause: e,
      });
    }

    return new ErrorDetailHolder({
      message: e.message,
      status: 500,
      cause: e,
    });
  }
}

interface ZodError {
  path: Array<string | number>;
  message: string;
  code: string;
  expected?: any;
  received?: any;
}
