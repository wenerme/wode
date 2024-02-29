import { MaybePromise } from '@wener/utils';

export async function serve(
  o: {
    fetch: (request: Request) => MaybePromise<Response>;
    port?: number;
  },
  cb: (o: { address: string; port: number }) => void,
) {
  let serve;
  if (process.release.name === 'node') {
    ({ serve } = await import('@hono/node-server'));
  } else if (process.release.name === 'bun') {
    serve = ({ fetch, port }: { fetch: (req: Request) => MaybePromise<Response>; port?: number }, cb: Function) => {
      (globalThis as any).Bun.serve({
        fetch,
        port,
      });
    };
  } else {
    serve = () => {
      throw new Error(`Unsupported platform: ${process.release.name}`);
    };
  }

  return serve(o, cb);
}
