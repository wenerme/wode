import { Query } from './types';

export interface CubeLoadResponse {}

export interface CubeLoadRequest {
  query: Query | Query[];
}
