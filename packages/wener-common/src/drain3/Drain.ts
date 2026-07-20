import { LogCluster } from './LogCluster';
import { Node } from './Node';
import type { ClusterUpdateType, DrainOptions, SearchStrategy } from './types';

/**
 * Simple LRU cache using Map iteration order.
 * Map preserves insertion order; re-inserting a key moves it to the end.
 */
class SimpleLRU<K, V> {
	private readonly map = new Map<K, V>();
	constructor(private readonly max: number) {}

	get(key: K): V | undefined {
		const value = this.map.get(key);
		if (value !== undefined) {
			// Move to end (most recently used)
			this.map.delete(key);
			this.map.set(key, value);
		}
		return value;
	}

	set(key: K, value: V): void {
		if (this.map.has(key)) {
			this.map.delete(key);
		} else if (this.map.size >= this.max) {
			// Evict oldest (first key)
			const first = this.map.keys().next().value;
			if (first !== undefined) {
				this.map.delete(first);
			}
		}
		this.map.set(key, value);
	}

	values(): IterableIterator<V> {
		return this.map.values();
	}
}

function isSliceEqual<T>(a: T[], b: T[]): boolean {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}

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
	public readonly logClusterDepth: number;
	public readonly maxNodeDepth: number;
	public readonly simTh: number;
	public readonly maxChildren: number;
	public readonly rootNode: Node;
	public readonly maxClusters: number;
	public readonly extraDelimiters: readonly string[];
	public readonly paramStr: string;
	public readonly parametrizeNumericTokens: boolean;

	private readonly idToCluster: SimpleLRU<number, LogCluster>;
	private clustersCounter: number = 0;

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

		this.maxNodeDepth = this.logClusterDepth - 2;
		this.rootNode = Node.newNode();
		this.idToCluster = new SimpleLRU<number, LogCluster>(this.maxClusters);
	}

	addLogMessage(content: string): { cluster: LogCluster; updateType: ClusterUpdateType } {
		const contentTokens = this.getContentAsTokens(content);
		const matchCluster = this.treeSearch(this.rootNode, contentTokens, this.simTh, false);

		let updateType: ClusterUpdateType = 'none';

		if (matchCluster === null) {
			this.clustersCounter++;
			const clusterId = this.clustersCounter;
			const cluster = new LogCluster(clusterId, contentTokens);
			this.idToCluster.set(clusterId, cluster);
			this.addSeqToPrefixTree(this.rootNode, cluster);
			updateType = 'created';
			return { cluster, updateType };
		}

		const newTemplateTokens = this.createTemplate(contentTokens, matchCluster.logTemplateTokens);

		if (!isSliceEqual(newTemplateTokens, matchCluster.logTemplateTokens)) {
			matchCluster.logTemplateTokens = newTemplateTokens;
			updateType = 'templateChanged';
		}

		matchCluster.size++;

		// Touch cluster to update its position in the LRU cache
		this.idToCluster.get(matchCluster.clusterId);

		return { cluster: matchCluster, updateType };
	}

	getContentAsTokens(content: string): string[] {
		let processed = content.trim();
		for (const delimiter of this.extraDelimiters) {
			processed = processed.replaceAll(delimiter, ' ');
		}
		return processed.split(/\s+/).filter((token) => token.length > 0);
	}

	private treeSearch(rootNode: Node, tokens: string[], simTh: number, includeParams: boolean): LogCluster | null {
		const tokenCount = tokens.length;
		const firstNode = rootNode.keyToChildNode.get(tokenCount.toString());

		if (firstNode === undefined) return null;

		if (tokenCount === 0) {
			const firstClusterId = firstNode.clusterIds[0];
			if (firstClusterId === undefined) return null;
			return this.idToCluster.get(firstClusterId) ?? null;
		}

		let currentNode: Node = firstNode;
		let currentNodeDepth = 1;
		for (const token of tokens) {
			if (currentNodeDepth >= this.maxNodeDepth || currentNodeDepth === tokenCount) break;

			const keyToChildNode: Map<string, Node> = currentNode.keyToChildNode;
			let nextNode: Node | undefined = keyToChildNode.get(token);
			if (nextNode === undefined) {
				nextNode = keyToChildNode.get(this.paramStr);
			}
			if (nextNode === undefined) return null;

			currentNode = nextNode;
			currentNodeDepth += 1;
		}

		return this.fastMatch(currentNode.clusterIds, tokens, simTh, includeParams);
	}

	private fastMatch(clusterIds: number[], tokens: string[], simTh: number, includeParams: boolean): LogCluster | null {
		let maxSim = -1;
		let maxParamCount = -1;
		let maxCluster: LogCluster | null = null;

		for (const clusterId of clusterIds) {
			const cluster = this.idToCluster.get(clusterId);
			if (cluster === undefined) continue;

			const [currentSim, paramCount] = this.getSeqDistance(cluster.logTemplateTokens, tokens, includeParams);

			if (currentSim > maxSim || (currentSim === maxSim && paramCount > maxParamCount)) {
				maxSim = currentSim;
				maxParamCount = paramCount;
				maxCluster = cluster;
			}
		}

		return maxSim >= simTh ? maxCluster : null;
	}

	private getSeqDistance(seq1: string[], seq2: string[], includeParams: boolean): [number, number] {
		if (seq1.length !== seq2.length) {
			throw new Error(`seq1 length ${seq1.length} not equals to seq2 length ${seq2.length}`);
		}

		if (seq1.length === 0) return [1, 0];

		let simTokens = 0;
		let paramCount = 0;

		for (let i = 0; i < seq1.length; i++) {
			if (seq1[i] === this.paramStr) {
				paramCount++;
			} else if (seq1[i] === seq2[i]) {
				simTokens++;
			}
		}

		if (includeParams) simTokens += paramCount;

		return [simTokens / seq1.length, paramCount];
	}

	private addSeqToPrefixTree(rootNode: Node, cluster: LogCluster): void {
		const tokenCount = cluster.logTemplateTokens.length;
		const tokenCountStr = tokenCount.toString();
		let firstLayerNode = rootNode.keyToChildNode.get(tokenCountStr);
		if (firstLayerNode === undefined) {
			firstLayerNode = Node.newNode();
			rootNode.keyToChildNode.set(tokenCountStr, firstLayerNode);
		}

		let currentNode = firstLayerNode;

		if (tokenCount === 0) {
			currentNode.clusterIds = [cluster.clusterId];
			return;
		}

		let currentDepth = 1;
		for (const token of cluster.logTemplateTokens) {
			if (currentDepth >= this.maxNodeDepth || currentDepth >= tokenCount) {
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
				currentNode = currentNode.keyToChildNode.get(token)!;
			}

			currentDepth++;
		}
	}

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

	match(content: string, strategy: SearchStrategy = 'never'): LogCluster | null {
		const requiredSimTh = 1.0;
		const contentTokens = this.getContentAsTokens(content);

		const fullSearch = (): LogCluster | null => {
			const allIds = this.getClustersIdsForSeqLen(contentTokens.length);
			return this.fastMatch(allIds, contentTokens, requiredSimTh, true);
		};

		if (strategy === 'always') return fullSearch();

		const matchCluster = this.treeSearch(this.rootNode, contentTokens, requiredSimTh, true);
		if (matchCluster !== null) return matchCluster;

		if (strategy === 'never') return null;

		return fullSearch();
	}

	private getClustersIdsForSeqLen(seqLen: number): number[] {
		const appendClusterRecursive = (node: Node, idListToFill: number[]): void => {
			idListToFill.push(...node.clusterIds);
			for (const childNode of node.keyToChildNode.values()) {
				appendClusterRecursive(childNode, idListToFill);
			}
		};

		const currentNode = this.rootNode.keyToChildNode.get(seqLen.toString());
		if (currentNode === undefined) return [];

		const target: number[] = [];
		appendClusterRecursive(currentNode, target);
		return target;
	}

	getClusters(): LogCluster[] {
		return [...this.idToCluster.values()];
	}

	toJSON() {
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
			clusters: this.getClusters().map((c) => c.toJSON()),
			clustersCounter: this.clustersCounter,
		};
	}

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

		const rootNode = Node.fromJSON(data.rootNode);
		for (const [key, node] of rootNode.keyToChildNode) {
			drain.rootNode.keyToChildNode.set(key, node);
		}
		drain.rootNode.clusterIds = rootNode.clusterIds;

		for (const clusterData of data.clusters) {
			const cluster = LogCluster.fromJSON(clusterData);
			drain.idToCluster.set(cluster.clusterId, cluster);
		}

		drain.clustersCounter = data.clustersCounter;

		return drain;
	}
}
