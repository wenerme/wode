import { AxiosError } from 'axios';
import { Catch, type ExceptionFilter, Logger } from '@nestjs/common';
import { type ArgumentsHost } from '@nestjs/common/interfaces/features/arguments-host.interface';

@Catch(AxiosError)
export class AxiosErrorFilter implements ExceptionFilter {
  private readonly log = new Logger(AxiosErrorFilter.name);

  catch(error: AxiosError, host: ArgumentsHost) {
    const { log } = this;
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const { status = 500 } = error.response || {};
    const message = (error.response?.data as any)?.message || error.message;
    log.error(`${error.config?.method?.toUpperCase()} ${error.config?.url} ${status} ${message}`);
    response.status(status).send({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
