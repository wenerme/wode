export type Expr =
	| BinaryExpr
	| CaseExpr
	| CompareExpr
	| FuncExpr
	| ListExpr
	| LiteralExpr
	| LogicExpr
	| RefExpr
	| UnaryExpr;

export type BinaryExpr = { type: 'binary'; op: BinaryOperator; left: Expr; right: Expr };
export type CaseExpr = { type: 'case'; condition?: Expr; cases: Array<{ when: Expr; then: Expr }>; else?: Expr };
export type CompareExpr = { type: 'compare'; op: CompareOperator; left: Expr; right: Expr };
export type FuncExpr = { type: 'func'; name: string; args: Expr[] };
export type ListExpr = { type: 'list'; items: Expr[] };
export type LiteralExpr = { type: 'literal'; value: string | number | boolean | null };
export type LogicExpr = { type: 'logic'; op: 'AND' | 'OR'; exprs: Expr[] };
export type RefExpr = { type: 'ref'; value: string[] };
export type UnaryExpr = { type: 'unary'; op: UnaryOperator; expr: Expr };

type UnaryOperator = 'NOT' | '!' | '-' | '+';
type CompareOperator =
	| '=' // $eq
	| '==' // $eq
	| '!=' // $ne
	| '<>' // $ne
	| '>' // $gt
	| '>=' // $gte
	| '<' // $lt
	| '<=' // $lte
	| 'LIKE' // $like
	| 'NOT LIKE' // $notLike
	| 'ILIKE' // $ilike
	| 'NOT ILIKE' // $nilike
	| 'RLIKE' //  $regex
	| 'NOT RLIKE' // $notRegex
	| 'IN' // $in
	| 'NOT IN' // $notIn, $nin
	| 'BETWEEN' // $between
	| 'NOT BETWEEN' // $notBetween
	| 'IS' // $isNull, $notNull
	| 'IS NOT' // $isNull, $notNull
	| '@>' //  $contains
	| '<@' // $contained
	| '~'; // $regex
type BinaryOperator = '+' | '-' | '*' | '/' | '%';
