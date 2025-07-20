import type { Expr } from './types';

function get(data: Record<string, any>, ref: string[]): any {
	let current = data;
	for (const key of ref) {
		switch (current) {
			case null:
			case undefined:
				return current;
		}
		if (Object.hasOwn(current, key)) {
			current = current[key];
		} else {
			return undefined;
		}
	}
	return current;
}

type EvalFunc = (e: Expr) => any;

export function resolveExpr(
	ast: Expr,
	{
		context = {},
		resolveRef = ({ path }) => {
			let val = get(context, path);
			if (typeof val === 'function') {
				return null;
			}
			return val;
		},
		resolveFunc = ({ name, args, resolve }) => {
			let val = get(context, [name]);
			if (typeof val === 'function') {
				return val(...args.map((e) => resolve(e)));
			}
			throw new Error(`Function "${name}" not found in context`);
		},
	}: {
		context?: Record<string, any>;
		resolveRef?: (ctx: { path: string[] }) => any;
		resolveFunc?: (ctx: { name: string; args: Expr[]; resolve: EvalFunc }) => any;
	} = {},
): any {
	const _eval: EvalFunc = (e: Expr) => {
		return resolveExpr(e, { context, resolveRef, resolveFunc });
	};
	switch (ast.type) {
		case 'literal':
			return ast.value;
		case 'ref':
			return resolveRef({
				path: ast.value,
			});
		case 'func':
			return resolveFunc({
				name: ast.name,
				args: ast.args,
				resolve: _eval,
			});
		case 'list':
			return ast.items.map((e) => _eval(e));
		case 'unary': {
			const v = _eval(ast.expr);
			switch (ast.op) {
				case 'NOT':
				case '!':
					return !v;
				case '+':
					return +v;
				case '-':
					return -v;
				default:
					throw new Error(`Unsupported unary op: ${(ast as any).op}`);
			}
		}
		case 'binary': {
			const l = _eval(ast.left);
			const r = _eval(ast.right);
			if (l === null || l === undefined || r === null || r === undefined) {
				return null;
			}
			switch (ast.op) {
				case '+':
					return l + r;
				case '-':
					return l - r;
				case '*':
					return l * r;
				case '/':
					return l / r;
				case '%':
					return l % r;
				default:
					throw new Error(`Unsupported binary op: ${(ast as any).op}`);
			}
		}
		case 'logic': {
			if (ast.op === 'AND') return ast.exprs.every((e) => _eval(e));
			if (ast.op === 'OR') return ast.exprs.some((e) => _eval(e));
			throw new Error(`Unsupported logic op: ${ast.op}`);
		}
		case 'case': {
			let v = ast.condition ? _eval(ast.condition) : true;
			for (let { when: w, then: t } of ast.cases) {
				if (_eval(w) === v) {
					return _eval(t);
				}
			}
			if (ast.else) {
				return _eval(ast.else);
			}
			return null;
		}
		case 'compare': {
			const l = _eval(ast.left);
			const r = Array.isArray(ast.right) ? ast.right.map((e) => _eval(e)) : _eval(ast.right);
			switch (ast.op) {
				case '=':
				case '==':
					return l === r;
				case '!=':
				case '<>':
					return l !== r;
				case '>':
					return l > r;
				case '>=':
					return l >= r;
				case '<':
					return l < r;
				case '<=':
					return l <= r;
				case 'IN':
					return Array.isArray(r) && r.includes(l);
				case 'NOT IN':
					return Array.isArray(r) && !r.includes(l);
				case 'BETWEEN':
					return Array.isArray(r) && l >= r[0] && l <= r[1];
				case 'NOT BETWEEN':
					return Array.isArray(r) && (l < r[0] || l > r[1]);
				case 'IS':
					return l === r;
				case 'IS NOT':
					return l !== r;
				default:
					throw new Error(`Unsupported compare op: ${ast.op}`);
			}
		}
		default:
			throw new Error(`Unknown AST node type: ${(ast as any).type}`);
	}
}
