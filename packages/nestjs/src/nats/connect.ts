import type { ConnectionOptions, NatsConnection } from 'nats';
import { getNatsOptions } from '../config';

export async function connect(opts: Partial<ConnectionOptions> = getNatsOptions()): Promise<NatsConnection> {
  const isWs = Array.from(opts.servers ?? []).some((v) => /^ws?s:/.test(v));
  if (isWs) {
    // nextjs 用 ws 有问题
    const { connect } = await import('nats.ws');
    return connect(opts);
  }
  const { connect } = await import('nats');
  return connect(opts);
}
