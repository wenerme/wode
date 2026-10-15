export type MutationQueue = <T>(operation: () => Promise<T>) => Promise<T>;

/** 创建串行变更队列；前一个操作失败不影响后续操作。 */
export function createMutationQueue(): MutationQueue {
	let tail: Promise<void> = Promise.resolve();
	return <T>(operation: () => Promise<T>): Promise<T> => {
		const result = tail.then(operation, operation);
		tail = result.then(
			() => undefined,
			() => undefined,
		);
		return result;
	};
}
