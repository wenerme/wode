import { Msg } from 'nats';

export interface NatsServiceServerOptions {
  getServiceSubject?: (o: { service: string }) => string[];
  // middlewares?: ServerMiddleware[];
  queue?: string;
}

export interface KnownNatsServerMetadata {
  NatsMsg: Msg;
}
