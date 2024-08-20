import { MaybePromise } from '@wener/utils';

type ServeFn = (
  o: { fetch: (request: Request) => MaybePromise<Response>; port?: number },
  cb: (o: { address: string; port: number }) => void,
) => any;

export async function serve(
  o: {
    fetch: (request: Request) => MaybePromise<Response>;
    port?: number;
  },
  cb: (o: { address: string; port: number }) => void,
) {
  let serve: ServeFn;
  if (process.versions.bun) {
    serve = ({ fetch, port }: { fetch: (req: Request) => MaybePromise<Response>; port?: number }, cb: Function) => {
      const svr = Bun.serve({
        fetch,
        port,
      });
      cb({ address: svr.hostname, port: svr.port });
      return svr;
    };
  } else if (process.release.name === 'node') {
    ({ serve } = await import('@hono/node-server'));
  } else {
    serve = () => {
      throw new Error(`Unsupported platform: ${process.release.name}`);
    };
  }

  return serve(o, cb);
}
