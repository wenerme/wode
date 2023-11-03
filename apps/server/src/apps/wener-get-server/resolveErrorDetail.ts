import { ConnectionException, DriverException, ServerException } from '@mikro-orm/core';
import { HttpException } from '@nestjs/common';
import { Errors } from '@wener/nestjs';
import { classOf } from '@wener/utils';
import pg from 'pg';

const { DatabaseError } = pg;

export function resolveErrorDetail(error: any) {
  let detail = Errors.resolve(error);
  // https://www.npmjs.com/package/http-errors
  // https://github.com/anatine/zod-plugins/blob/main/packages/zod-nestjs/src/lib/zod-validation-pipe.ts
  // let cause = detail.cause || error;
  // UniqueConstraintViolationException
  // UnprocessableEntityException
  // BadRequestException by ZodValidationPipe
  if (error instanceof HttpException) {
    let response = error.getResponse();
    if (typeof response === 'string') {
      detail = detail.with({ message: response });
    } else if ('message' in response) {
      let m = response.message;
      Array.isArray(m) && (m = m.join(', '));
      detail = detail.with({ message: String(m) });
    }
  }
  // mikro-orm
  if (error instanceof DriverException) {
    if (error instanceof ServerException) {
      detail = detail.with({ message: '数据层错误' });
    } else if (error instanceof ConnectionException) {
      detail = detail.with({ message: '数据层链接错误' });
    } else {
      detail = detail.with({ message: '数据库错误' });
    }
  }
  if (error instanceof DatabaseError) {
    detail = detail.with({ message: '数据库错误' });
  }

  console.error(`ErrorDetail`, classOf(error), error);
  return detail;
}
