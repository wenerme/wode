import { createLazyPromise, LazyPromise } from '@wener/utils';
import { buildAuthUrl } from './buildAuthParams';
import { RequestPayload, ResponsePayload } from './types';

export interface ClientOptionsInit extends Partial<ClientOptions> {}

export interface ClientOptions {
  url: string;
  apiKey: string;
  apiSecret: string;
  appId: string;
  parameters?: any;
}

export class Client {
  readonly options: ClientOptions;

  constructor({
    url = 'wss://spark-api.xf-yun.com/v2.1/chat',
    apiSecret = process.env.XF_API_SECRET ?? '',
    apiKey = process.env.XF_API_KEY ?? '',
    appId = process.env.XF_APP_ID ?? '',
  }: ClientOptionsInit) {
    if (!apiKey || !apiSecret) {
      throw new Error('Missing API Key or Secret');
    }
    if (!appId) {
      throw new Error('Missing App ID');
    }
    this.options = {
      url,
      apiSecret,
      apiKey,
      appId,
    };
  }

  send(
    req: RequestPayload,
    {
      signal,
    }: {
      signal?: AbortSignal;
    } = {},
  ) {
    req = structuredClone(req);
    req.header.app_id ||= this.options.appId;

    return transform<ResponsePayload>(async (next) => {
      try {
        const ws = await this._connect();
        signal?.addEventListener('abort', () => {
          ws.close();
        });
        ws.addEventListener('close', () => {
          next([undefined, true]);
        });
        ws.addEventListener('error', (e) => {
          next([undefined, true], new Error('Connect error'));
        });
        ws.addEventListener('message', (e) => {
          const data = JSON.parse(e.data as string) as ResponsePayload;
          next([data, data.header.status === 2]);
        });

        ws.send(JSON.stringify(req));
      } catch (e) {
        next([undefined, true], e);
      }
    });
  }

  private _connect() {
    const url = buildAuthUrl(this.options);
    let ws = new WebSocket(url);
    return new Promise<WebSocket>((resolve, reject) => {
      ws.addEventListener('open', (e) => {
        resolve(ws);
      });
      ws.addEventListener('close', (e) => {
        console.log(`close ${e.code} ${e.reason} ${e.wasClean}`);
      });
      ws.addEventListener('error', (e) => {
        console.log(`error`, e);
        reject(e);
      });
    });
  }
}

function transform<T>(fn: (next: (val: [T | undefined, boolean] | undefined, err?: any) => void) => void) {
  const values: Array<Promise<[T | undefined, boolean]>> = [];
  let recv: (val: [T | undefined, boolean] | undefined, err?: any) => void;
  {
    let next: LazyPromise<[T | undefined, boolean]>;
    values.push((next = createLazyPromise()));
    recv = (val, err) => {
      if (err !== undefined) {
        next.reject(err);
      } else if (val !== undefined) {
        next.resolve(val);
      } else {
        return;
      }
      values.push((next = createLazyPromise()));
    };
  }

  fn(recv);

  return (async function* () {
    let value: T | undefined;
    for (let i = 0, done = false; !done; i++) {
      [value, done] = await values[i];
      delete values[i];
      if (value !== undefined) {
        yield value;
      }
    }
  })();
}
