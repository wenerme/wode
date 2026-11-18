import type { Node } from './types';

/**
 * Walk every AST node (statements, table expressions and expressions) depth first.
 *
 * Return `true` from `fn` to skip the children of current node.
 */
export function visitMysql(
	node: unknown,
	fn: (node: Node, parent?: Node) => undefined | boolean | void,
	parent?: Node,
): void {
	if (!node || typeof node !== 'object') return;
	if (Array.isArray(node)) {
		for (const v of node) visitMysql(v, fn, parent);
		return;
	}
	let next = parent;
	if (typeof (node as Node).type === 'string') {
		if (fn(node as Node, parent)) return;
		next = node as Node;
	}
	for (const v of Object.values(node)) {
		if (v && typeof v === 'object') visitMysql(v, fn, next);
	}
}
