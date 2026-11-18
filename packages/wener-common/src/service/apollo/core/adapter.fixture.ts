import type { ApolloAdapter, ApolloConfigReadRequest, ApolloHttpRequest } from './interface';

/** Adapts fixture responses to the generic JSON boundary used by the production adapter. */
export function createApolloTestAdapter(input: {
	request(input: ApolloHttpRequest): Promise<unknown>;
	readConfig(input?: ApolloConfigReadRequest): Promise<unknown>;
	close(): Promise<void>;
}): ApolloAdapter {
	return {
		async request<T>(request: ApolloHttpRequest): Promise<T> {
			return (await input.request(request)) as T;
		},
		async readConfig<T>(request?: ApolloConfigReadRequest): Promise<T> {
			return (await input.readConfig(request)) as T;
		},
		close: () => input.close(),
	};
}
