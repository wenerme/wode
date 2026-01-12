import { LRUCache } from 'lru-cache';
import { LogCluster } from './LogCluster';
import { Node } from './Node';
import type { ClusterUpdateType, DrainOptions, SearchStrategy } from './types';

/**
 * Helper function to check if arrays are equal.
 */
function isSliceEqual<T>(a: T[], b: T[]): boolean {
	if (a.length !== b.length) {
		return false;
	}
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			return false;
		}
	}
	return true;
}

/**
 * Checks if a string contains any digit characters.
 */
function hasNumbers(s: string): boolean {
	return /\d/.test(s);
}

/**
 * Core Drain algorithm for log clustering.
 *
 * Drain is an online log parsing algorithm that groups log messages into clusters
 * based on their structural similarity, extracting templates by parameterizing
 * variable parts of the logs.
 */
export class Drain {
	/**
	 * Depth of the prefix tree for log clustering.
	 */
	public readonly logClusterDepth: number;

	/**
	 * Maximum depth of a prefix tree node, starting from zero.
	 */
	public readonly maxNodeDepth: number;

	/**
	 * Similarity threshold for matching log messages to clusters (0.0 to 1.0).
	 */
	public readonly simTh: number;

	/**
	 * Maximum number of children nodes in the prefix tree.
	 */
	public readonly maxChildren: number;

	/**
	 * Root node of the prefix tree.
	 */
	public readonly rootNode: Node;

	/**
	 * Maximum number of clusters to maintain in LRU cache.
	 */
	public readonly maxClusters: number;

	/**
	 * Additional delimiters to replace with spaces during tokenization.
	 */
	public readonly extraDelimiters: readonly string[];

	/**
	 * String used to represent parameterized tokens in templates.
	 */
	public readonly paramStr: string;

	/**
	 * Whether to automatically parameterize tokens containing numbers.
	 */
	public readonly parametrizeNumericTokens: boolean;

	/**
	 * LRU cache mapping cluster IDs to clusters.
	 */
	private readonly idToCluster: LRUCache<number, LogCluster>;

	/**
	 * Counter for generating unique cluster IDs.
	 */
	private clustersCounter: number = 0;

	/**
	 * Creates a new Drain instance.
	 *
	 * @param options Configuration options
	 * @throws Error if logClusterDepth is less than 3
	 */
	constructor(options: DrainOptions = {}) {
		this.logClusterDepth = options.logClusterDepth ?? 4;
		this.simTh = options.simTh ?? 0.4;
		this.maxChildren = options.maxChildren ?? 100;
		this.maxClusters = options.maxClusters ?? 1000;
		this.extraDelimiters = options.extraDelimiters ?? [];
		this.paramStr = options.paramStr ?? '<*>';
		this.parametrizeNumericTokens = options.parametrizeNumericTokens ?? true;

		if (this.logClusterDepth < 3) {
			throw new Error('depth argument must be at least 3');
		}

		// max depth of a prefix tree node, starting from zero
		this.maxNodeDepth = this.logClusterDepth - 2;

		this.rootNode = Node.newNode();

		// Initialize LRU cache
		this.idToCluster = new LRUCache<number, LogCluster>({
			max: this.maxClusters,
		});
	}

	/**
	 * Adds a log message and returns the matched cluster and update type.
	 *
	 * @param content The log message content
	 * @returns Object containing the matched cluster and update type
	 */
	addLogMessage(content: string): { cluster: LogCluster; updateType: ClusterUpdateType } {
		const contentTokens = this.getContentAsTokens(content);

		const matchCluster = this.treeSearch(this.rootNode, contentTokens, this.simTh, false);

		let updateType: ClusterUpdateType = 'none';

		if (matchCluster === null) {
			// match no existing log cluster
			this.clustersCounter++;
			const clusterId = this.clustersCounter;
			const cluster = new LogCluster(clusterId, contentTokens);
			this.idToCluster.set(clusterId, cluster);
			this.addSeqToPrefixTree(this.rootNode, cluster);
			updateType = 'created';
			return { cluster, updateType };
		} else {
			// add the new log message to the existing cluster
			const newTemplateTokens = this.createTemplate(contentTokens, matchCluster.logTemplateTokens);

			if (isSliceEqual(newTemplateTokens, matchCluster.logTemplateTokens)) {
				updateType = 'none';
			} else {
				matchCluster.logTemplateTokens = newTemplateTokens;
				updateType = 'templateChanged';
			}

			matchCluster.size++;

			// touch cluster to update its state in the cache
			this.idToCluster.get(matchCluster.clusterId);
		}

		return { cluster: matchCluster, updateType };
	}

	/**
	 * Converts log content into tokens by splitting on spaces and applying delimiters.
	 */
	getContentAsTokens(content: string): string[] {
		let processed = content.trim();
		for (const delimiter of this.extraDelimiters) {
			processed = processed.replaceAll(delimiter, ' ');
		}
		return processed.split(/\s+/).filter((token) => token.length > 0);
	}

	/**
	 * Searches the prefix tree for a matching cluster.
	 *
	 * @param rootNode Root node of the tree
	 * @param tokens Tokens to search for
	 * @param simTh Similarity threshold
	 * @param includeParams Whether to include parameters in similarity calculation
	 * @returns Matched cluster or null
	 */
	private treeSearch(rootNode: Node, tokens: string[], simTh: number, includeParams: boolean): LogCluster | null {
		// at first level, children are grouped by token (word) count
		const tokenCount = tokens.length;
		const tokenCountStr = tokenCount.toString();
		let currentNode = rootNode.keyToChildNode.get(tokenCountStr);

		// no template with same token count yet
		if (currentNode === undefined) {
			return null;
		}

		// handle case of empty log string - return the single cluster in that group
		if (tokenCount === 0) {
			const firstClusterId = currentNode.clusterIds[0];
			if (firstClusterId === undefined) {
				return null;
			}
			const logCluster = this.idToCluster.get(firstClusterId);
			return logCluster ?? null;
		}

		// find the leaf node for this log - a path of nodes matching the first N tokens (N=tree depth)
		let currentNodeDepth = 1;
		for (const token of tokens) {
			// at max depth
			if (currentNodeDepth >= this.maxNodeDepth) {
				break;
			}

			// this is last token
			if (currentNodeDepth === tokenCount) {
				break;
			}

			const keyToChildNode = currentNode.keyToChildNode;
			let nextNode = keyToChildNode.get(token);
			if (nextNode === undefined) {
				// no exact next token exist, try wildcard node
				nextNode = keyToChildNode.get(this.paramStr);
			}
			if (nextNode === undefined) {
				// no wildcard node exist
				return null;
			}

			currentNode = nextNode;
			currentNodeDepth += 1;
		}

		return this.fastMatch(currentNode.clusterIds, tokens, simTh, includeParams);
	}

	/**
	 * Finds the best match for a log message (represented as tokens) against a list of clusters.
	 *
	 * @param clusterIds List of cluster IDs to match against
	 * @param tokens The log message, separated into tokens
	 * @param simTh Minimum required similarity threshold
	 * @param includeParams Consider tokens matched to wildcard parameters in similarity threshold
	 * @returns Best match cluster or null
	 */
	private fastMatch(
		clusterIds: number[],
		tokens: string[],
		simTh: number,
		includeParams: boolean,
	): LogCluster | null {
		let matchCluster: LogCluster | null = null;

		let maxSim = -1;
		let maxParamCount = -1;
		let maxCluster: LogCluster | null = null;

		for (const clusterId of clusterIds) {
			// try to retrieve cluster from cache
			const cluster = this.idToCluster.get(clusterId);
			if (cluster === undefined) {
				continue;
			}

			const [currentSim, paramCount] = this.getSeqDistance(cluster.logTemplateTokens, tokens, includeParams);

			if (currentSim > maxSim || (currentSim === maxSim && paramCount > maxParamCount)) {
				maxSim = currentSim;
				maxParamCount = paramCount;
				maxCluster = cluster;
			}
		}

		if (maxSim >= simTh) {
			matchCluster = maxCluster;
		}

		return matchCluster;
	}

	/**
	 * Calculates the similarity distance between two sequences.
	 *
	 * @param seq1 Template sequence
	 * @param seq2 Log message sequence
	 * @param includeParams Whether to include parameters in similarity calculation
	 * @returns Tuple of [similarity (0.0 to 1.0), parameter count]
	 */
	private getSeqDistance(seq1: string[], seq2: string[], includeParams: boolean): [number, number] {
		// seq1 is a template, seq2 is the log to match
		if (seq1.length !== seq2.length) {
			throw new Error(`seq1 length ${seq1.length} not equals to seq2 length ${seq2.length}`);
		}

		// sequences are empty - full match
		if (seq1.length === 0) {
			return [1, 0];
		}

		let simTokens = 0;
		let paramCount = 0;

		for (let i = 0; i < seq1.length; i++) {
			const token1 = seq1[i];
			const token2 = seq2[i];

			if (token1 === this.paramStr) {
				paramCount++;
				continue;
			}

			if (token1 === token2) {
				simTokens++;
			}
		}

		if (includeParams) {
			simTokens += paramCount;
		}

		const retVal = simTokens / seq1.length;
		return [retVal, paramCount];
	}

	/**
	 * Adds a sequence (cluster) to the prefix tree.
	 *
	 * @param rootNode Root node of the tree
	 * @param cluster Cluster to add
	 */
	private addSeqToPrefixTree(rootNode: Node, cluster: LogCluster): void {
		const tokenCount = cluster.logTemplateTokens.length;
		const tokenCountStr = tokenCount.toString();
		let firstLayerNode = rootNode.keyToChildNode.get(tokenCountStr);
		if (firstLayerNode === undefined) {
			firstLayerNode = Node.newNode();
			rootNode.keyToChildNode.set(tokenCountStr, firstLayerNode);
		}

		let currentNode = firstLayerNode;

		// handle case of empty log string
		if (tokenCount === 0) {
			currentNode.clusterIds = [cluster.clusterId];
			return;
		}

		let currentDepth = 1;
		for (const token of cluster.logTemplateTokens) {
			// if at max depth or this is last token in template - add current log cluster to the leaf node
			if (currentDepth >= this.maxNodeDepth || currentDepth >= tokenCount) {
				// clean up stale clusters before adding a new one.
				const newClusterIds: number[] = [];
				for (const clusterId of currentNode.clusterIds) {
					if (this.idToCluster.get(clusterId) !== undefined) {
						newClusterIds.push(clusterId);
					}
				}
				newClusterIds.push(cluster.clusterId);
				currentNode.clusterIds = newClusterIds;
				break;
			}

			// if token not matched in this layer of existing tree.
			if (!currentNode.keyToChildNode.has(token)) {
				if (this.parametrizeNumericTokens && hasNumbers(token)) {
					const node = currentNode.keyToChildNode.get(this.paramStr);
					if (node === undefined) {
						const newNode = Node.newNode();
						currentNode.keyToChildNode.set(this.paramStr, newNode);
						currentNode = newNode;
					} else {
						currentNode = node;
					}
				} else {
					const wildcardNode = currentNode.keyToChildNode.get(this.paramStr);
					if (wildcardNode !== undefined) {
						if (currentNode.keyToChildNode.size < this.maxChildren) {
							const newNode = Node.newNode();
							currentNode.keyToChildNode.set(token, newNode);
							currentNode = newNode;
						} else {
							currentNode = wildcardNode;
						}
					} else {
						if (currentNode.keyToChildNode.size + 1 < this.maxChildren) {
							const newNode = Node.newNode();
							currentNode.keyToChildNode.set(token, newNode);
							currentNode = newNode;
						} else if (currentNode.keyToChildNode.size + 1 === this.maxChildren) {
							const newNode = Node.newNode();
							currentNode.keyToChildNode.set(this.paramStr, newNode);
							currentNode = newNode;
						} else {
							currentNode = currentNode.keyToChildNode.get(this.paramStr)!;
						}
					}
				}
			} else {
				// if the token is matched
				currentNode = currentNode.keyToChildNode.get(token)!;
			}

			currentDepth++;
		}
	}

	/**
	 * Creates a template by merging two sequences, parameterizing differing tokens.
	 *
	 * @param seq1 First sequence (log message)
	 * @param seq2 Second sequence (existing template)
	 * @returns New template tokens
	 */
	private createTemplate(seq1: string[], seq2: string[]): string[] {
		if (seq1.length !== seq2.length) {
			throw new Error(`seq1 length ${seq1.length} not equals to seq2 length ${seq2.length}`);
		}
		const retVal = [...seq2];

		for (let i = 0; i < seq1.length; i++) {
			if (seq1[i] !== seq2[i]) {
				retVal[i] = this.paramStr;
			}
		}

		return retVal;
	}

	/**
	 * Matches a log message against an already existing cluster.
	 *
	 * Match shall be perfect (sim_th=1.0). A new cluster will NOT be created as a result
	 * of this call, nor any cluster modifications.
	 *
	 * @param content Log message to match
	 * @param strategy When to perform full cluster search
	 * @returns Matched cluster or null if no match found
	 */
	match(content: string, strategy: SearchStrategy = 'never'): LogCluster | null {
		const requiredSimTh = 1.0;
		const contentTokens = this.getContentAsTokens(content);

		const fullSearch = (): LogCluster | null => {
			const allIds = this.getClustersIdsForSeqLen(contentTokens.length);
			return this.fastMatch(allIds, contentTokens, requiredSimTh, true);
		};

		if (strategy === 'always') {
			return fullSearch();
		}

		const matchCluster = this.treeSearch(this.rootNode, contentTokens, requiredSimTh, true);
		if (matchCluster !== null) {
			return matchCluster;
		}

		if (strategy === 'never') {
			return null;
		}

		return fullSearch();
	}

	/**
	 * Returns all clusters with the specified count of tokens.
	 *
	 * @param seqLen Sequence length
	 * @returns List of cluster IDs
	 */
	private getClustersIdsForSeqLen(seqLen: number): number[] {
		const appendClusterRecursive = (node: Node, idListToFill: number[]): void => {
			idListToFill.push(...node.clusterIds);
			for (const childNode of node.keyToChildNode.values()) {
				appendClusterRecursive(childNode, idListToFill);
			}
		};

		const currentNode = this.rootNode.keyToChildNode.get(seqLen.toString());

		// no template with same token count
		if (currentNode === undefined) {
			return [];
		}

		const target: number[] = [];
		appendClusterRecursive(currentNode, target);
		return target;
	}

	/**
	 * Returns all clusters.
	 *
	 * @returns Array of all clusters
	 */
	getClusters(): LogCluster[] {
		const clusters: LogCluster[] = [];
		for (const cluster of this.idToCluster.values()) {
			clusters.push(cluster);
		}
		return clusters;
	}

	/**
	 * Converts the Drain instance to JSON for serialization.
	 */
	toJSON(): {
		logClusterDepth: number;
		maxNodeDepth: number;
		simTh: number;
		maxChildren: number;
		rootNode: unknown;
		maxClusters: number;
		extraDelimiters: string[];
		paramStr: string;
		parametrizeNumericTokens: boolean;
		clusters: unknown[];
		clustersCounter: number;
	} {
		const clusters: LogCluster[] = [];
		for (const cluster of this.idToCluster.values()) {
			clusters.push(cluster);
		}

		return {
			logClusterDepth: this.logClusterDepth,
			maxNodeDepth: this.maxNodeDepth,
			simTh: this.simTh,
			maxChildren: this.maxChildren,
			rootNode: this.rootNode.toJSON(),
			maxClusters: this.maxClusters,
			extraDelimiters: [...this.extraDelimiters],
			paramStr: this.paramStr,
			parametrizeNumericTokens: this.parametrizeNumericTokens,
			clusters: clusters.map((c) => c.toJSON()),
			clustersCounter: this.clustersCounter,
		};
	}

	/**
	 * Creates a Drain instance from JSON data.
	 */
	static fromJSON(data: {
		logClusterDepth: number;
		maxNodeDepth: number;
		simTh: number;
		maxChildren: number;
		rootNode: {
			keyToChildNode: Record<string, unknown>;
			clusterIds: number[];
		};
		maxClusters: number;
		extraDelimiters: string[];
		paramStr: string;
		parametrizeNumericTokens: boolean;
		clusters: Array<{
			clusterId: number;
			logTemplateTokens: string[];
			size: number;
		}>;
		clustersCounter: number;
	}): Drain {
		const drain = new Drain({
			logClusterDepth: data.logClusterDepth,
			simTh: data.simTh,
			maxChildren: data.maxChildren,
			maxClusters: data.maxClusters,
			extraDelimiters: data.extraDelimiters,
			paramStr: data.paramStr,
			parametrizeNumericTokens: data.parametrizeNumericTokens,
		});

		drain.rootNode.keyToChildNode.clear();
		drain.rootNode.clusterIds = [];

		// Reconstruct root node
		const rootNode = Node.fromJSON(data.rootNode);
		for (const [key, node] of rootNode.keyToChildNode) {
			drain.rootNode.keyToChildNode.set(key, node);
		}
		drain.rootNode.clusterIds = rootNode.clusterIds;

		// Restore clusters to cache
		for (const clusterData of data.clusters) {
			const cluster = LogCluster.fromJSON(clusterData);
			drain.idToCluster.set(cluster.clusterId, cluster);
		}

		drain.clustersCounter = data.clustersCounter;

		return drain;
	}
}
