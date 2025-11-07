import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { AnyContractRouter, ContractRouterClient } from '@orpc/contract';
import { buildBaseUrl } from '../utils/buildBaseUrl';
import type { CreateContractClientOptions } from './createOpenApiContractClient';
import { resolveLinkPlugins } from './resolveLinkPlugins';

export type CreateRpcContractClientOptions = CreateContractClientOptions;

export function createRpcContractClient<C extends AnyContractRouter>(
	options: CreateRpcContractClientOptions = {},
): ContractRouterClient<C> {
	let {
		url = '/api/rpc',
		baseUrl = globalThis.location?.origin || 'http://localhost',
		apiKey,
		getApiKey,
		getHeaders,
	} = options;
	url = buildBaseUrl(url, baseUrl);

	const baseHeaders = new Headers(options.headers);
	if (apiKey) {
		baseHeaders.set('Authorization', `Bearer ${apiKey}`);
	}

	const plugins = resolveLinkPlugins({
		dedup: true,
		batch: true,
		...options,
	});
	const link = new RPCLink({
		url,
		headers: () => {
			let headers = new Headers(baseHeaders);

			let accessToken = getApiKey?.();
			if (accessToken) {
				headers.set('Authorization', `Bearer ${accessToken}`);
			}
			headers = getHeaders?.(headers) ?? headers;
			return headers;
		},
		fetch: options.fetch,
		plugins,
	});

	const client: ContractRouterClient<C> = createORPCClient(link);
	return client;
}
