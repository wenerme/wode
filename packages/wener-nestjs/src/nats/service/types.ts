import type { Msg } from 'nats';
import type { ServerMiddleware } from '../../service';

export interface NatsServiceServerModuleOptions {
  getServiceSubject?: (o: { service: string }) => string[];
  // middlewares?: ServerMiddleware[];
  queue?: string;
  middlewares?: ServerMiddleware[];
}

export interface KnownNatsServerMetadata {
  NatsMsg: Msg;
}
