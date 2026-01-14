import {
	createConnectRouter,
	type ConnectRouter,
	type ConnectRouterOptions,
	type ContextValues,
} from '@connectrpc/connect';
import { universalRequestFromNodeRequest, universalResponseToNodeResponse } from '@connectrpc/connect-node';
import type { UniversalHandler } from '@connectrpc/connect/protocol';
import type { HttpBindings } from '@hono/node-server';
import { RESPONSE_ALREADY_SENT } from '@hono/node-server/utils/response';
import { Logger } from '@nestjs/common';
import { arrayOfMaybeArray } from '@wener/utils';
import type { Handler } from 'hono';

export type ServeNodeConnectOptions = ConnectRouterOptions & {
	router?: ConnectRouter;
	routes: (router: ConnectRouter) => void;
	prefix?: string | string[];
	contextValues?: (req: any) => ContextValues;
	log?: Logger;
};

export function serveNodeConnect(options: ServeNodeConnectOptions): Handler<{ Bindings: HttpBindings }> {
	const router = options.router || createConnectRouter(options);
	const log = options.log || new Logger(serveNodeConnect.name);
	options.routes(router);

	let allPrefix = arrayOfMaybeArray(options.prefix);
	if (!allPrefix.length) {
		allPrefix.push('');
	}
	allPrefix = allPrefix.map((v) => {
		return v.replace(/[/]+$/, '');
	});
	const paths = new Map<string, UniversalHandler>();
	for (const uHandler of router.handlers) {
		for (let prefix of allPrefix) {
			paths.set(prefix + uHandler.requestPath, uHandler);
		}
	}

	return async (c) => {
		const requestPath = c.req.path;
		const hdr = paths.get(requestPath);
		if (!hdr) {
			log.warn(`handler for ${requestPath} not found`);
			return c.notFound();
		}

		try {
			log.log(`RPC ${hdr.service.typeName}.${hdr.method.name}`);
			const res = await hdr(
				universalRequestFromNodeRequest(
					c.env.incoming,
					c.env.outgoing,
					c.req.raw.body as any,
					options.contextValues?.(c),
				),
			);
			await universalResponseToNodeResponse(res, c.env.outgoing);
			return RESPONSE_ALREADY_SENT;
		} catch (e) {
			log.error(`handler for rpc ${hdr.method.name} of ${hdr.service.typeName} failed`);
			console.error(e);
			throw e;
		}
	};
}
