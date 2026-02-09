import type { MaybePromise } from '@wener/utils';

interface ServeOptions {
	fetch: (request: Request) => MaybePromise<Response>;
	port?: number;
	/** Connection idle timeout in seconds (Bun only) */
	idleTimeout?: number;
}

type ServeFn = (o: ServeOptions, cb: (o: { address: string; port: number }) => void) => any;

export async function serve(o: ServeOptions, cb: (o: { address: string; port: number }) => void) {
	let serve: ServeFn;
	if (process.versions.bun) {
		serve = ({ fetch, port, idleTimeout }: ServeOptions, cb: Function) => {
			const svr = Bun.serve({ fetch, port, idleTimeout });
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
