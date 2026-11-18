import type { Expr } from './types';

// Words the grammar does not accept as names (see `KEYWORDS` in parser.peggy).
const KEYWORDS = new Set([
	'AND',
	'AS',
	'BETWEEN',
	'CASE',
	'ELSE',
	'END',
	'FALSE',
	'ILIKE',
	'IN',
	'IS',
	'LIKE',
	'NOT',
	'NULL',
	'OR',
	'RLIKE',
	'THEN',
	'TRUE',
	'WHEN',
]);

/** Whether a reference segment or function name can be written in MiniQuery. */
export function isQueryName(name: string): boolean {
	return /^[a-zA-Z][_a-zA-Z0-9]*$/.test(name) && !KEYWORDS.has(name.toUpperCase());
}

/**
 * Quote a string literal. MiniQuery strings have no escapes: a value is written between `"` or `'`, whichever
 * it does not contain; a value containing both can not be written.
 */
export function quoteQueryString(value: string): string {
	if (!value.includes('"')) return `"${value}"`;
	if (!value.includes("'")) return `'${value}'`;
	throw new Error(`String can not be written in MiniQuery, it contains both quote characters: ${value}`);
}

/**
 * Format an expression as MiniQuery text that parses back to a semantically equivalent normalized expression. Throws for values the
 * syntax can not express: names that are not identifiers, strings with both quote characters, and
 * non-finite numbers.
 */
export function formatQuery(ast: Expr): string {
	function isValue(node: Expr): boolean {
		return node.type === 'literal' || node.type === 'ref';
	}

	function assertDense<T>(items: T[], message: string): void {
		for (let i = 0; i < items.length; i++) assert(i in items, message);
	}

	function operand(node: Expr): string {
		const text = visit(node);
		return node.type === 'compare' ? `(${text})` : text;
	}

	const visit = (node: Expr): string => {
		switch (node.type) {
			case 'logic': {
				assertDense(node.exprs, 'Logic expressions must be dense');
				assert(node.exprs.length >= 2, 'Logic expressions must contain at least two expressions');
				assert(node.op === 'AND' || node.op === 'OR', `Logic operator ${node.op} is not supported by MiniQuery`);
				assert(
					node.exprs[0]?.type !== 'logic' || node.exprs[0].op !== node.op,
					`Nested ${node.op} expressions can not be formatted without changing the AST`,
				);
				let s = node.exprs.map(visit).join(` ${node.op} `);
				if (s) {
					s = `(${s})`;
				}
				return s;
			}
			case 'binary':
				assert(
					node.op === '+' || node.op === '-' || node.op === '*' || node.op === '/' || node.op === '%',
					`Binary operator ${node.op} is not supported by MiniQuery`,
				);
				return `(${operand(node.left)} ${node.op} ${operand(node.right)})`;
			case 'compare': {
				const right = node.right;
				switch (node.op) {
					case '==':
						return `${operand(node.left)} = ${operand(right)}`;
					case 'BETWEEN':
					case 'NOT BETWEEN': {
						assert(
							right.type === 'list' && right.items.length === 2,
							'BETWEEN/NOT BETWEEN requires a list with exactly two items',
						);
						assertDense(right.items, 'BETWEEN/NOT BETWEEN items must be dense');
						const [a, b] = right.items;
						assert(a.type === 'literal' || a.type === 'ref', 'BETWEEN/NOT BETWEEN items must be values');
						assert(b.type === 'literal' || b.type === 'ref', 'BETWEEN/NOT BETWEEN items must be values');
						return `${operand(node.left)} ${node.op} ${visit(a)} AND ${visit(b)}`;
					}
					case 'IN':
					case 'NOT IN': {
						assert(right.type === 'list', 'IN/NOT IN requires a list');
						assertDense(right.items, 'IN/NOT IN items must be dense');
						assert(
							right.items.every((item) => item.type === 'literal' || item.type === 'ref'),
							'IN/NOT IN items must be values',
						);
						return `${operand(node.left)} ${node.op} (${right.items.map(visit).join(', ')})`;
					}
					case 'LIKE':
					case 'NOT LIKE':
						assert(right.type === 'literal' && typeof right.value === 'string', `${node.op} requires a string value`);
						return `${operand(node.left)} ${node.op} ${visit(right)}`;
					case 'ILIKE':
					case 'NOT ILIKE':
						throw new Error(`${node.op} is not supported by MiniQuery`);
					case 'IS':
					case 'IS NOT':
						assert(
							right.type === 'literal' && (right.value === null || typeof right.value === 'boolean'),
							`${node.op} requires NULL or a boolean value`,
						);
						return `${operand(node.left)} ${node.op} ${visit(right)}`;
					case 'RLIKE':
					case 'NOT RLIKE':
						throw new Error(`${node.op} is not supported by MiniQuery; use ~ instead`);
				}
				assert(
					['=', '!=', '<>', '>', '>=', '<', '<=', '@>', '<@', '~'].includes(node.op),
					`Comparison operator ${node.op} is not supported by MiniQuery`,
				);
				return `${operand(node.left)} ${node.op} ${operand(right)}`;
			}
			case 'case': {
				assertDense(node.cases, 'CASE clauses must be dense');
				assert(node.cases.length > 0, 'CASE expressions must contain at least one WHEN clause');
				let s = ['CASE'];
				if (node.condition !== undefined && node.condition !== null) s.push(visit(node.condition));
				node.cases.forEach((c) => {
					s.push(`WHEN ${visit(c.when)} THEN ${visit(c.then)}`);
				});
				if (node.else !== undefined) {
					s.push(`ELSE ${visit(node.else)}`);
				}
				s.push('END');
				return s.join(' ');
			}
			case 'unary':
				if (node.op === '!') return `(NOT ${visit(node.expr)})`;
				assert(node.op === 'NOT', `Unary operator ${node.op} is not supported by MiniQuery`);
				return `(${node.op} ${visit(node.expr)})`;
			case 'literal':
				switch (node.value) {
					case null:
					case true:
					case false:
						return String(node.value).toUpperCase();
				}
				if (typeof node.value === 'number') return formatNumber(node.value);
				assert(typeof node.value === 'string', `Literal value is not supported by MiniQuery: ${String(node.value)}`);
				return quoteQueryString(node.value);
			case 'func':
				assert(isQueryName(node.name), `Function name can not be written in MiniQuery: ${node.name}`);
				assertDense(node.args, 'Function arguments must be dense');
				assert(node.args.every(isValue), 'Function arguments must be values');
				return `${node.name}(${node.args.map(visit).join(', ')})`;
			case 'list':
				assertDense(node.items, 'List items must be dense');
				assert(node.items.every(isValue), 'List items must be values');
				return `[${node.items.map(visit).join(', ')}]`;
			case 'ref':
				assertDense(node.value, 'References must be dense');
				assert(node.value.length > 0, 'References must contain at least one name');
				for (const name of node.value) {
					assert(isQueryName(name), `Name can not be written in MiniQuery: ${node.value.join('.')}`);
				}
				return node.value.join('.');
			default:
				throw new Error(`Unknown type: ${(node as any).type}`);
		}
	};

	return visit(ast);
}

// MiniQuery numbers have no exponent: write large integers in full, reject other exponent forms.
function formatNumber(n: number): string {
	assert(Number.isFinite(n), `Number can not be written in MiniQuery: ${n}`);
	if (Object.is(n, -0)) return '-0';
	const s = String(n);
	if (!s.includes('e')) return s;

	// JavaScript uses exponent notation for both very large integers and small decimals;
	// MiniQuery accepts the value but has no exponent grammar, so move the decimal point.
	const [rawMantissa, rawExponent] = s.split('e');
	const negative = rawMantissa.startsWith('-');
	const mantissa = negative ? rawMantissa.slice(1) : rawMantissa;
	const exponent = Number(rawExponent);
	const [integer, fraction = ''] = mantissa.split('.');
	const digits = integer + fraction;
	const decimal = integer.length + exponent;
	let result: string;
	if (decimal <= 0) result = `0.${'0'.repeat(-decimal)}${digits}`;
	else if (decimal >= digits.length) result = `${digits}${'0'.repeat(decimal - digits.length)}`;
	else result = `${digits.slice(0, decimal)}.${digits.slice(decimal)}`;
	return negative ? `-${result}` : result;
}

function assert(condition: boolean, message: string): asserts condition {
	if (!condition) {
		throw new Error(message);
	}
}
