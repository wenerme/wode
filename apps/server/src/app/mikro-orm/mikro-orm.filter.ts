import { type FastifyReply } from 'fastify';
import { DriverException, NotFoundError, ValidationError } from '@mikro-orm/core';
import { type ArgumentsHost, Catch, type ExceptionFilter, Logger } from '@nestjs/common';

@Catch(ValidationError, DriverException)
export class MikroOrmErrorFilter implements ExceptionFilter {
  log = new Logger(MikroOrmErrorFilter.name);

  catch(error: ValidationError | DriverException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<FastifyReply>();

    // https://github.com/mikro-orm/mikro-orm/blob/master/packages/core/src/errors.ts
    if (error instanceof NotFoundError) {
      return res.status(404).send({
        statusCode: 404,
        message: error.message,
      });
    }
    this.log.error(error);

    if (error instanceof DriverException) {
      return res.status(500).send({
        statusCode: 500,
        message: '数据库错误',
      });
    }
    res.status(400).send({
      statusCode: 400,
      message: '数据库校验错误',
    });
  }
}
