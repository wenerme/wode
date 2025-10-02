import { inspect } from 'node:util';
import type { Server } from '@modelcontextprotocol/sdk/server';
import {
	CallToolRequestSchema,
	ListResourcesRequestSchema,
	ListToolsRequestSchema,
	ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createRouterClient, os } from '@orpc/server';
import { consola, type ConsolaInstance } from 'consola';
import { createMcpServerHandler } from './createMcpServerHandler';

export function setContractHandler(
	server: Server,
	{
		contract,
		client,
		impl,
	}: {
		contract: any;
		client?: any;
		impl?: any;
	},
) {
	client = createClient({
		client,
		impl,
	});

	const handler = createMcpServerHandler(contract, client);

	server.setRequestHandler(ListToolsRequestSchema, handler.listTool);
	server.setRequestHandler(CallToolRequestSchema, handler.callTool);

	if (handler.listResources) {
		server.setRequestHandler(ListResourcesRequestSchema, handler.listResources);
		server.setRequestHandler(ReadResourceRequestSchema, handler.readResource);
	}

	return {
		client,
	};
}

function createClient({
	// contract,
	impl,
	client,
	context,
	logger = consola.withTag('contract-client'),
}: {
	// contract: any;
	impl?: any;
	client?: any;
	logger?: ConsolaInstance;
	context?: Record<string, any>;
}) {
	if (client) {
		return client;
	}
	if (impl) {
		const router = os
			.use(async ({ next }) => {
				try {
					return await next();
				} catch (e) {
					if (process.env.NODE_ENV === 'development') {
						console.error(`Failed`, inspect(e, { depth: 5, colors: true }));
					} else {
						logger.error(`Failed`, e);
					}
					throw e;
				}
			})
			.router(impl);
		return createRouterClient(router, {
			context: context || {},
		});
	}
	throw new Error(`need client or impl`);
}
