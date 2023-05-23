import { type FastifyReply, type FastifyRequest } from 'fastify';

export type NestRequest = FastifyRequest['raw'];
export type NestResponse = FastifyReply['raw'];

// https://www.fastify.io/docs/latest/Reference/Middleware/
export interface NestMiddleware {
  use(req: NestRequest, res: NestResponse, next: (error?: Error | any) => void): any;
}
