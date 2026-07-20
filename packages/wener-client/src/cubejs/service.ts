import type { Query } from './types';

export type CubeLoadResponse = {};

export interface CubeLoadRequest {
	query: Query | Query[];
}
