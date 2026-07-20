import type { Expr } from './types';

export function visit(expr: Expr, fn: (node: Expr) => undefined | boolean): void {
	if (fn(expr)) {
		return;
	}
	switch (expr.type) {
		case 'logic':
			expr.exprs.forEach((e) => visit(e, fn));
			break;
		case 'binary':
			visit(expr.left, fn);
			visit(expr.right, fn);
			break;
		case 'compare': {
			visit(expr.left, fn);
			const arr = Array.isArray(expr.right) ? expr.right : [expr.right];
			arr.forEach((e) => visit(e, fn));
			break;
		}
		case 'case': {
			expr.condition && visit(expr.condition, fn);
			expr.cases.forEach((c) => {
				visit(c.when, fn);
				visit(c.then, fn);
			});
			expr.else && visit(expr.else, fn);
			break;
		}
		case 'unary':
			visit(expr.expr, fn);
			break;
		case 'func':
			expr.args.forEach((e) => visit(e, fn));
			break;
		case 'list':
			expr.items.forEach((e) => visit(e, fn));
			break;
		// 'literal' and 'ref' are leaves, do nothing
	}
}
