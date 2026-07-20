/**
 * Represents a cluster of similar log messages with a common template.
 */
export class LogCluster {
	constructor(
		public readonly clusterId: number,
		public logTemplateTokens: string[],
		public size: number = 1,
	) {}

	/**
	 * Returns the template as a space-separated string.
	 */
	getTemplate(): string {
		return this.logTemplateTokens.join(' ');
	}

	/**
	 * Returns a string representation of the cluster.
	 */
	toString(): string {
		return `ID=${this.clusterId.toString().padEnd(5)} : size=${this.size.toString().padEnd(10)}: ${this.getTemplate()}`;
	}

	/**
	 * Creates a LogCluster from JSON data.
	 */
	static fromJSON(data: { clusterId: number; logTemplateTokens: string[]; size: number }): LogCluster {
		return new LogCluster(data.clusterId, data.logTemplateTokens, data.size);
	}

	/**
	 * Converts the cluster to JSON for serialization.
	 */
	toJSON(): {
		clusterId: number;
		logTemplateTokens: string[];
		size: number;
	} {
		return {
			clusterId: this.clusterId,
			logTemplateTokens: this.logTemplateTokens,
			size: this.size,
		};
	}
}
