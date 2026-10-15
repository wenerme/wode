import type { AiRouter, AiRouterFetch } from './types';

/** Adapts the Fetch URL/init signature used by SDK providers to Hono's Request entry point. */
export function createAiRouterFetch(app: Pick<AiRouter, 'fetch'>): AiRouterFetch {
	return async (input, init) => app.fetch(new Request(input, init));
}
