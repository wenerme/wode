/**
 * Represents a node in the prefix tree used by Drain algorithm.
 */
export class Node {
	/**
	 * Map of token keys to child nodes.
	 */
	public readonly keyToChildNode: Map<string, Node> = new Map();

	/**
	 * List of cluster IDs associated with this node.
	 */
	public clusterIds: number[] = [];

	/**
	 * Creates a new empty node.
	 */
	static newNode(): Node {
		return new Node();
	}

	/**
	 * Converts the node to JSON for serialization.
	 */
	toJSON(): {
		keyToChildNode: Record<string, unknown>;
		clusterIds: number[];
	} {
		const keyToChildNode: Record<string, unknown> = {};
		for (const [key, node] of this.keyToChildNode) {
			keyToChildNode[key] = node.toJSON();
		}
		return {
			keyToChildNode,
			clusterIds: this.clusterIds,
		};
	}

	/**
	 * Creates a Node from JSON data.
	 */
	static fromJSON(data: { keyToChildNode: Record<string, unknown>; clusterIds: number[] }): Node {
		const node = new Node();
		node.clusterIds = data.clusterIds;
		for (const [key, childData] of Object.entries(data.keyToChildNode)) {
			node.keyToChildNode.set(
				key,
				Node.fromJSON(childData as { keyToChildNode: Record<string, unknown>; clusterIds: number[] }),
			);
		}
		return node;
	}
}
