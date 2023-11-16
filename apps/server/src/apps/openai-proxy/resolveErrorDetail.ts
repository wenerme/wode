import { ConnectionException, DriverException, ServerException } from '@mikro-orm/core';
import { HttpException } from '@nestjs/common';
import { ErrorDetail, Errors } from '@wener/utils';
import { ZodError } from 'zod';

export function resolveServerError(error: any) {
  let detail: ErrorDetail | undefined;
  // https://www.npmjs.com/package/http-errors
  // https://github.com/anatine/zod-plugins/blob/main/packages/zod-nestjs/src/lib/zod-validation-pipe.ts
  // let cause = detail.cause || error;
  // UniqueConstraintViolationException
  // UnprocessableEntityException
  // BadRequestException by ZodValidationPipe
  if (error instanceof HttpException) {
    detail = Errors.with({
      status: error.getStatus(),
      message: error.message,
      cause: error.cause,
    });
    let response = error.getResponse();
    if (typeof response === 'string') {
      detail = detail.with({ message: response });
    } else if ('message' in response) {
      let m = response.message;
      Array.isArray(m) && (m = m.join(', '));
      detail = detail.with({ message: String(m) });
    }
  } else if (error instanceof DriverException) {
    detail = Errors.InternalServerError.with({
      code: error.code,
      message: error.message,
      cause: error,
    });
    if (error instanceof ServerException) {
      detail = detail.with({ message: `数据层错误: ${error.constructor.name}` });
    } else if (error instanceof ConnectionException) {
      detail = detail.with({ message: `数据层链接错误: ${error.constructor.name}` });
    } else {
      detail = detail.with({ message: `数据库错误: ${error.constructor.name}` });
    }
  } else if (error instanceof ZodError) {
    detail = Errors.BadRequest.with({
      message: error.issues
        .map((v) => {
          return `${v.path.join('.')}: ${v.message}`;
        })
        .join('; '),
      cause: error,
    });
  }
  if (detail) {
    console.trace(`ErrorDetail`, error);
  }
  return detail;
}

// export function resolveErrorDetail(error: any) {
//   let detail = Errors.resolve(error);
//   // https://www.npmjs.com/package/http-errors
//   // https://github.com/anatine/zod-plugins/blob/main/packages/zod-nestjs/src/lib/zod-validation-pipe.ts
//   // let cause = detail.cause || error;
//   // UniqueConstraintViolationException
//   // UnprocessableEntityException
//   // BadRequestException by ZodValidationPipe
//   if (error instanceof HttpException) {
//     let response = error.getResponse();
//     if (typeof response === 'string') {
//       detail = detail.with({ message: response });
//     } else if ('message' in response) {
//       let m = response.message;
//       Array.isArray(m) && (m = m.join(', '));
//       detail = detail.with({ message: String(m) });
//     }
//   }
//   if (error instanceof DriverException) {
//     if (error instanceof ServerException) {
//       detail = detail.with({ message: '数据层错误' });
//     } else if (error instanceof ConnectionException) {
//       detail = detail.with({ message: '数据层链接错误' });
//     } else {
//       detail = detail.with({ message: '数据库错误' });
//     }
//   }
//
//   console.error(`ErrorDetail`, error);
//   return detail;
// }
