import { createAsyncIterator, merge } from '@wener/utils';
import { buildAuthUrl } from './buildAuthParams';
import { RequestPayload, ResponsePayload } from './types';

export interface ClientOptionsInit extends Partial<ClientOptions> {}

export interface ClientOptions {
  url: string;
  apiKey: string;
  apiSecret: string;
  appId: string;
  parameter?: any;
}

export class XunfeiSparkClient {
  readonly options: ClientOptions;

  constructor({
    url = 'wss://spark-api.xf-yun.com/v2.1/chat',
    apiSecret = process.env.XF_API_SECRET ?? '',
    apiKey = process.env.XF_API_KEY ?? '',
    appId = process.env.XF_APP_ID ?? '',
    ...rest
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
      ...rest,
    };
  }

  send(
    _req: Partial<RequestPayload>,
    {
      signal,
    }: {
      signal?: AbortSignal;
    } = {},
  ) {
    const req: RequestPayload = merge(
      {
        header: {
          app_id: this.options.appId,
        },
        parameter: this.options.parameter ?? {},
        payload: {
          message: {
            text: [],
          },
        },
      },
      _req,
    );
    if (!req.payload.message.text.length) {
      throw new Error('Missing message');
    }

    return createAsyncIterator<ResponsePayload>(async (next) => {
      try {
        const ws = await this._connect();
        signal?.addEventListener('abort', () => {
          ws.close();
        });
        ws.addEventListener('close', () => {
          next([undefined, true]);
        });
        ws.addEventListener('error', (_e) => {
          next([undefined, true], new Error('Connect error'));
        });
        ws.addEventListener('message', (e) => {
          const data = JSON.parse(e.data as string) as ResponsePayload;
          if (!data.header.code) {
            next([data, data.header.status === 2]);
          } else {
            const { code, message, sid } = data.header;
            next([undefined, true], new Error(`[${code}] ${message} ${sid}`));
          }
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
      ws.addEventListener('open', (_e) => {
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
