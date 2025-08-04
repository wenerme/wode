import type { Expr } from './types';

export function formatQuery(ast: Expr): string {
	const visit = (node: Expr): string => {
		switch (node.type) {
			case 'logic': {
				let s = node.exprs.map(visit).join(` ${node.op} `);
				if (s) {
					s = `(${s})`;
				}
				return s;
			}
			case 'binary':
				return `(${visit(node.left)} ${node.op} ${visit(node.right)})`;
			case 'compare': {
				const right = node.right;
				switch (node.op) {
					case 'BETWEEN':
					case 'NOT BETWEEN': {
						assert(
							right.type === 'list' && right.items.length === 2,
							'BETWEEN/NOT BETWEEN requires a list with exactly two items',
						);
						const [a, b] = right.items;
						return `${visit(node.left)} ${node.op} ${visit(a)} AND ${visit(b)}`;
					}
					case 'IN':
					case 'NOT IN': {
						assert(right.type === 'list', 'IN/NOT IN requires a list');
						return `${visit(node.left)} ${node.op} (${right.items.map(visit).join(', ')})`;
					}
				}
				return `${visit(node.left)} ${node.op} ${visit(right)}`;
			}
			case 'case': {
				let s = ['CASE'];
				node.condition && s.push(visit(node.condition));
				node.cases.forEach((c) => {
					s.push(`WHEN ${visit(c.when)} THEN ${visit(c.then)}`);
				});
				if (node.else) {
					s.push(`ELSE ${visit(node.else)}`);
				}
				s.push('END');
				return s.join(' ');
			}
			case 'unary':
				return `(${node.op} ${visit(node.expr)})`;
			case 'literal':
				switch (node.value) {
					case null:
					case true:
					case false:
						return String(node.value).toUpperCase();
				}
				return JSON.stringify(node.value);
			case 'func':
				return `${node.name}(${node.args.map(visit).join(', ')})`;
			case 'list':
				return `[${node.items.map(visit).join(', ')}]`;
			case 'ref':
				return node.value.join('.');
			default:
				throw new Error(`Unknown type: ${(node as any).type}`);
		}
	};

	return visit(ast);
}

function assert(condition: boolean, message: string): asserts condition {
	if (!condition) {
		throw new Error(message);
	}
}
