export type { IFetchService } from './IFetchService';
export * from './FetchServiceContract';
export { FetchOperations } from './operations';

import { FetchRequestSchema, type FetchRequest } from './FetchServiceContract';
export { FetchServiceCapability } from './IFetchService';

export function parseFetchRequest(input: unknown): FetchRequest {
	const result = FetchRequestSchema.safeParse(input);
	if (!result.success) throw new TypeError('Invalid fetch request');
	return result.data;
}
