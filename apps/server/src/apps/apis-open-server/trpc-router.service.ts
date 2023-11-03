import { Injectable } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { initTRPC } from '@trpc/server';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';

export type AppRouter = TrpcRouter['appRouter'];

@Injectable()
export class TrpcRouter {
  constructor() {}

  t = initTRPC.create();

  appRouter = this.t.router({
    ping: this.t.procedure.query(() => {
      return 'pong';
    }),
  });

  createContext = () => {
    return {};
  };

  applyMiddleware(app: NestFastifyApplication) {
    app.use(fastifyTRPCPlugin, {
      // useWSS: true,
      prefix: '/trpc',
      trpcOptions: { router: this.appRouter, createContext: this.createContext },
    });
  }
}
