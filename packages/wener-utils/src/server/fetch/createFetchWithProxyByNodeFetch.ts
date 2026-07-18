import type { FetchLike } from '../../fetch';
import { getGlobalThis } from '../../web/getGlobalThis';

export function createFetchWithProxyByNodeFetch({
	proxy,
	fetch,
}: {
	proxy?: string;
	fetch?: FetchLike;
} = {}): FetchLike {
	const globalObject = getGlobalThis();
	if (!proxy) {
		return fetch || globalObject.fetch;
	}

	let agent: any;
	const Request = globalObject.Request;
	let NodeRequest: any;
	let NodeFetch: any;
	return async (url, init?: RequestInit) => {
		if (!agent) {
			const { HttpsProxyAgent } = await import('https-proxy-agent');
			agent = new HttpsProxyAgent(proxy);
		}

		// node-fetch 才可以，node v18 fetch 不支持
		if (!NodeRequest) {
			({ Request: NodeRequest, default: NodeFetch } = await import('node-fetch'));
		}

		fetch ||= NodeFetch;

		if (url instanceof Request) {
			return (fetch as any)(new Request(url, { agent } as any));
		}
		if ((url as any) instanceof NodeRequest) {
			return (fetch as any)(new NodeRequest(url, { agent } as any));
		}
		return (fetch as any)(url, { ...init, agent } as any);
	};
}
