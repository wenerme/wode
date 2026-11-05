export type { FetchRequest, FetchResponse, IFetchService } from './IFetchService';
export { FetchRequestSchema, FetchContract } from './FetchContract';
export { FetchOperations } from './operations';

import { FetchRequestSchema } from './FetchContract';
import type { FetchRequest } from './IFetchService';
export { FetchServiceCapability } from './IFetchService';

export function parseFetchRequest(input: unknown): FetchRequest {
	const result = FetchRequestSchema.safeParse(input);
	if (!result.success) throw new TypeError('Invalid fetch request');
	return result.data;
}
