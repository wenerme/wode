/** Compares JSON values without treating YAML collections or dates as plain records. */
export function equalApolloJsonValues(left: unknown, right: unknown): boolean {
	if (Object.is(left, right)) return true;
	if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object') return false;
	if (Array.isArray(left) || Array.isArray(right)) {
		return (
			Array.isArray(left) &&
			Array.isArray(right) &&
			left.length === right.length &&
			left.every((value, index) => equalApolloJsonValues(value, right[index]))
		);
	}
	const leftPrototype = Object.getPrototypeOf(left);
	const rightPrototype = Object.getPrototypeOf(right);
	if (leftPrototype !== rightPrototype) return false;
	if (left instanceof Date && right instanceof Date) return Object.is(left.getTime(), right.getTime());
	// JSON records have no collection state beyond their enumerable own keys.
	// Conservatively treat unsupported YAML tags as changed rather than dropping a requested edit.
	if (leftPrototype !== Object.prototype && leftPrototype !== null) return false;
	const keys = Object.keys(left);
	const other = right as Record<string, unknown>;
	return (
		keys.length === Object.keys(right).length &&
		keys.every(
			(key) => Object.hasOwn(other, key) && equalApolloJsonValues((left as Record<string, unknown>)[key], other[key]),
		)
	);
}
