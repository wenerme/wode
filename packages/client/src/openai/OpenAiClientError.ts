import { ErrorResponse } from './request';

export class OpenAiClientError extends Error {
  readonly type: string;
  readonly code: string;
  readonly param: string | null;

  constructor({ message, type, code, param }: ErrorResponse['error']) {
    super(message);
    this.type = type;
    this.code = code;
    this.param = param;
  }
}
