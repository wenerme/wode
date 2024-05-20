import type { Knex } from 'knex';

export function parseKnexUri(uri: string, o: Knex.Config = {}): Knex.Config {
  if (!uri) {
    return {};
  }
  let url = new URL(uri);
  let oc = typeof o.connection === 'object' ? o.connection : {};

  let co: any = {};

  if ('options' in oc) {
    co = Object.assign({}, oc.options) as any;
  }

  for (let [k, v] of url.searchParams.entries()) {
    switch (v) {
      case 'true':
      case 'false':
        co[k] = Boolean(v);
        break;
      default:
        co[k] = v;
    }
  }

  let out: Knex.Config = {
    ...o,
    client: url.protocol.substring(0, url.protocol.length - 1),
    connection: {
      ...oc,

      host: url.hostname,
      server: url.hostname,
      port: parseInt(url.port),
      user: url.username,
      password: url.password || undefined,
      database: url.pathname.substring(1) || undefined,
      options: co,
    } as Knex.StaticConnectionConfig,
  };
  return out;
}
