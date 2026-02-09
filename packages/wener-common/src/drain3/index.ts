/**
 * Drain3 - A TypeScript implementation of the Drain log clustering algorithm.
 *
 * Drain is an online log parsing algorithm that groups log messages into clusters
 * based on their structural similarity, extracting templates by parameterizing
 * variable parts of the logs.
 *
 * @example
 * ```typescript
 * import { Drain, TemplateMiner, MemoryPersistence } from '@wener/common/drain3';
 *
 * // Basic usage
 * const drain = new Drain({
 *   logClusterDepth: 4,
 *   simTh: 0.4,
 *   maxClusters: 1000
 * });
 *
 * const result = drain.addLogMessage('[INFO] User 123 logged in');
 * console.log(result.cluster.getTemplate()); // [INFO] User <*> logged in
 *
 * // Advanced usage with persistence
 * const miner = new TemplateMiner(drain, new MemoryPersistence());
 * await miner.addLogMessage('[INFO] User 123 logged in');
 * ```
 */

export { Drain } from './Drain';
export { LogCluster } from './LogCluster';
export { Node } from './Node';
export { TemplateMiner } from './TemplateMiner';

export type { ClusterUpdateType, DrainOptions, ExtractedParameter, SearchStrategy } from './types';

export type { PersistenceHandler } from './persistence/PersistenceHandler';
export { MemoryPersistence } from './persistence/MemoryPersistence';
export { FilePersistence } from './persistence/FilePersistence';
