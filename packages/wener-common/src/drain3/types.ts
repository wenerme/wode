/**
 * Cluster update type indicating what happened when a log message was processed.
 */
export type ClusterUpdateType = 'none' | 'created' | 'templateChanged';

/**
 * Search strategy for matching log messages against existing clusters.
 *
 * - 'never': Fastest, always performs tree search [O(log(n))] but might produce false negatives
 * - 'fallback': Performs linear search [O(n)] only if tree search found no match, should not have false negatives
 * - 'always': Slowest, always evaluates all clusters and selects the best match with least wildcard parameters
 */
export type SearchStrategy = 'never' | 'fallback' | 'always';

/**
 * Configuration options for Drain algorithm.
 */
export interface DrainOptions {
	/**
	 * Depth of the prefix tree for log clustering. Must be at least 3.
	 * @default 4
	 */
	logClusterDepth?: number;

	/**
	 * Similarity threshold (0.0 to 1.0) for matching log messages to clusters.
	 * @default 0.4
	 */
	simTh?: number;

	/**
	 * Maximum number of children nodes in the prefix tree.
	 * @default 100
	 */
	maxChildren?: number;

	/**
	 * Maximum number of clusters to maintain in LRU cache.
	 * @default 1000
	 */
	maxClusters?: number;

	/**
	 * Additional delimiters to replace with spaces during tokenization.
	 * @default []
	 */
	extraDelimiters?: string[];

	/**
	 * String used to represent parameterized tokens in templates.
	 * @default "<*>"
	 */
	paramStr?: string;

	/**
	 * Whether to automatically parameterize tokens containing numbers.
	 * @default true
	 */
	parametrizeNumericTokens?: boolean;
}

/**
 * Extracted parameter from a log message based on a template.
 */
export interface ExtractedParameter {
	/**
	 * The extracted parameter value.
	 */
	value: string;

	/**
	 * The mask name (e.g., "*") that matched this parameter.
	 */
	maskName: string;
}
