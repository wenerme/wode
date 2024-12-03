export type Exprs = Expr[];
export type Expr =
  | CommentExpr
  | ParenthesesExpr
  | KeywordCondition
  | LogicalCondition
  | NotCondition
  | CompareCondition;

export type CommentExpr = {
  type: 'comment';
  value: string;
};

export type ParenthesesExpr = {
  type: 'parentheses';
  value: Expr[];
};

export type KeywordCondition = {
  type: 'keyword';
  value: string;
  negative?: boolean;
  exact?: boolean;
};

export type LogicalCondition = {
  type: 'logical';
  operator: 'and' | 'or';
  value: Expr[];
};

export type NotCondition = {
  type: 'not';
  value: Expr;
};

export type CompareCondition = {
  type: 'compare';
  field: string;
  /**
   * mention value for eq, ne only
   * range require range value
   */
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'range' | 'has';
  negative?: boolean;
  mention?: boolean;
  value: Value;
};

export type Value = LiteralValue | RangeValue | MentionValue;

export type LiteralValue = {
  type?: 'literal';
  format?: 'date' | 'date-time';
  value: string | number | null;
};

export type MentionValue = {
  type?: 'literal';
  format: 'mention';
  value: string;
};

export type RangeValue = {
  type: 'range';
  minimum: LiteralValue | undefined;
  maximum: LiteralValue | undefined;
  minimumExclusive: boolean;
  maximumExclusive: boolean;
};
