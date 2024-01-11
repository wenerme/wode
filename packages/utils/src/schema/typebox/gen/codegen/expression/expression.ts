/*--------------------------------------------------------------------------

@sinclair/typebox-expression

The MIT License (MIT)

Copyright (c) 2023 Haydn Paterson (sinclair) <haydn.developer@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

---------------------------------------------------------------------------*/

// -------------------------------------------------------------------------
// Expression: Error
// -------------------------------------------------------------------------
export interface ExpressionError {
  expression: Expression;
  path: string;
  value: unknown;
}

// -------------------------------------------------------------------------
// Expression: Tree
// -------------------------------------------------------------------------

export type Equatable = string | number | boolean | null | undefined;
export type Compariable = number | bigint;
export type TypeOf = 'undefined' | 'symbol' | 'function' | 'string' | 'number' | 'boolean' | 'bigint' | 'object';

export interface ExpressionOptions {
  $id?: string;
  [key: string]: any;
}
export interface AndExpression extends ExpressionOptions {
  type: 'And';
  expr: Expression[];
}
export interface CallExpression<
  E extends Expression = Expression,
  T extends string = string,
  A extends unknown[] = unknown[],
> extends ExpressionOptions {
  type: 'Call';
  target: T;
  parameters: [...A];
  expr: E;
}

export interface ElementsDistinctExpression extends ExpressionOptions {
  type: 'ElementsDistinct';
}
export interface ElementsExpression<E extends Expression = Expression> extends ExpressionOptions {
  type: 'Elements';
  expr: E;
}
export interface EqualsExpression<T extends Equatable = Equatable> extends ExpressionOptions {
  type: 'Equals';
  value: T;
}
export type FunctionExpressionCallback = (value: unknown) => boolean;

export interface FunctionExpression<F extends FunctionExpressionCallback = FunctionExpressionCallback>
  extends ExpressionOptions {
  type: 'Function';
  callback: F;
}
export interface GreaterThanEqualExpression<T extends Compariable = Compariable> extends ExpressionOptions {
  type: 'GreaterThanEqual';
  value: T;
}
export interface GreaterThanExpression<T extends Compariable = Compariable> extends ExpressionOptions {
  type: 'GreaterThan';
  value: T;
}
export interface FalseExpression extends ExpressionOptions {
  type: 'False';
}
export interface IfThenElseExpression extends ExpressionOptions {
  type: 'IfThenElse';
  if: Expression;
  then: Expression;
  else: Expression;
}
export interface InstanceOfExpression<T extends string = string> extends ExpressionOptions {
  type: 'InstanceOf';
  value: T;
}
export interface IndexExpression<E extends Expression = Expression, I extends number = number>
  extends ExpressionOptions {
  type: 'Index';
  index: I;
  expr: E;
}

export interface IsArrayExpression extends ExpressionOptions {
  type: 'IsArray';
}
export interface IsBigIntExpression extends TypeOfExpression<'bigint'> {}
export interface IsBooleanExpression extends TypeOfExpression<'boolean'> {}
export interface IsFiniteExpression extends ExpressionOptions {
  type: 'IsFinite';
}
export interface IsFunctionExpression extends TypeOfExpression<'function'> {}
export interface IsIntegerExpression extends ExpressionOptions {
  type: 'IsInteger';
}
export interface IsNaNExpression extends ExpressionOptions {
  type: 'IsNaN';
}
export interface IsNullExpression extends EqualsExpression<null> {}
export interface IsNumberExpression extends TypeOfExpression<'number'> {}
export interface IsSafeIntegerExpression extends ExpressionOptions {
  type: 'IsSafeInteger';
}
export interface IsObjectExpression extends TypeOfExpression<'object'> {}
export interface IsStringExpression extends TypeOfExpression<'string'> {}
export interface IsSymbolExpression extends TypeOfExpression<'symbol'> {}
export interface IsUndefinedExpression extends ExpressionOptions {
  type: 'IsUndefined';
}
export interface KeyInExpression<T extends string = string> extends ExpressionOptions {
  type: 'KeyIn';
  value: T;
}
export interface OrExpression extends ExpressionOptions {
  type: 'Or';
  expr: Expression[];
}
export interface NotExpression<E extends Expression = Expression> extends ExpressionOptions {
  type: 'Not';
  expr: E;
}
export interface LessThanEqualExpression<T extends Compariable = Compariable> extends ExpressionOptions {
  type: 'LessThanEqual';
  value: T;
}
export interface LessThanExpression<T extends Compariable = Compariable> extends ExpressionOptions {
  type: 'LessThan';
  value: T;
}
export interface MultipleOfExpression<T extends number = number> extends ExpressionOptions {
  type: 'MultipleOf';
  value: T;
}
export interface PropertiesIncludePatternExpression<E extends Expression = Expression> extends ExpressionOptions {
  type: 'PropertiesIncludePattern';
  pattern: string;
  expr: E;
}
export interface PropertiesIncludeExpression<E extends Expression = Expression, K extends string[] = string[]>
  extends ExpressionOptions {
  type: 'PropertiesInclude';
  keys: K;
  expr: E;
}
export interface PropertiesExcludePatternExpression<E extends Expression = Expression> extends ExpressionOptions {
  type: 'PropertiesExcludePattern';
  pattern: string;
  expr: E;
}
export interface PropertiesExcludeExpression<E extends Expression = Expression, K extends string[] = string[]>
  extends ExpressionOptions {
  type: 'PropertiesExclude';
  keys: K;
  expr: E;
}
export interface PropertiesLengthExpression<T extends number = number> extends ExpressionOptions {
  type: 'PropertiesLength';
  value: T;
}
export interface PropertiesMaximumExpression<T extends number = number> extends ExpressionOptions {
  type: 'PropertiesMaximum';
  value: T;
}
export interface PropertiesMinimumExpression<T extends number = number> extends ExpressionOptions {
  type: 'PropertiesMinimum';
  value: T;
}
export interface PropertiesExpression<E extends Expression = Expression> extends ExpressionOptions {
  type: 'Properties';
  expr: E;
}
export interface PropertyKeysExpression<T extends readonly string[] = string[]> extends ExpressionOptions {
  type: 'PropertyKeys';
  keys: [...T];
}
export interface PropertyExpression<E extends Expression = Expression, K extends string = string>
  extends ExpressionOptions {
  type: 'Property';
  key: K;
  expr: E;
}
export interface RefExpression<T extends string = string> extends ExpressionOptions {
  type: 'Ref';
  $ref: T;
}
export interface IsPatternExpression extends ExpressionOptions {
  type: 'IsPattern';
  pattern: string;
}
export interface TrueExpression extends ExpressionOptions {
  type: 'True';
}
export interface TypeOfExpression<T extends TypeOf = TypeOf> extends ExpressionOptions {
  type: 'TypeOf';
  value: T;
}
export type Expression =
  | AndExpression
  | CallExpression
  | FalseExpression
  | FunctionExpression
  | ElementsDistinctExpression
  | ElementsExpression
  | EqualsExpression
  | GreaterThanExpression
  | GreaterThanEqualExpression
  | IfThenElseExpression
  | IndexExpression
  | InstanceOfExpression
  | IsArrayExpression
  | IsIntegerExpression
  | IsNaNExpression
  | IsObjectExpression
  | IsBigIntExpression
  | IsBooleanExpression
  | IsFiniteExpression
  | IsFunctionExpression
  | IsNullExpression
  | IsNumberExpression
  | IsSafeIntegerExpression
  | IsStringExpression
  | IsSymbolExpression
  | IsUndefinedExpression
  | KeyInExpression
  | LessThanEqualExpression
  | LessThanExpression
  | MultipleOfExpression
  | NotExpression
  | OrExpression
  | PropertiesIncludeExpression
  | PropertiesIncludePatternExpression
  | PropertiesExcludeExpression
  | PropertiesExcludePatternExpression
  | PropertiesLengthExpression
  | PropertiesMaximumExpression
  | PropertiesMinimumExpression
  | PropertiesExpression
  | PropertyKeysExpression
  | PropertyExpression
  | RefExpression
  | IsPatternExpression
  | TrueExpression
  | TypeOfExpression;

// ---------------------------------------------------------------
// Expression: Builder
// ---------------------------------------------------------------

/** Type Expressions builder used to assert JavaScript values */
export namespace Expression {
  /** Creates a `And` expression where each sub expression is evaluated in sequence */
  export function And<E extends Expression>(
    expressions: (() => Generator<E>) | Array<E>,
    options: ExpressionOptions = {},
  ): Expression {
    const expr = globalThis.Array.isArray(expressions) ? expressions : [...expressions()];
    if (expr.length === 0) return Expression.False();
    if (expr.length === 1) return expr[0];
    return { ...options, type: 'And', expr };
  }
  /** Creates a `Call` expression that will invoke the object target and check the return for the given sub expression */
  export function Call<E extends Expression, T extends string, P extends unknown[]>(
    target: T,
    parameters: P,
    expression: E,
    options: ExpressionOptions = {},
  ): CallExpression<E, T, P> {
    return { ...options, type: 'Call', target, parameters, expr: expression };
  }
  /** Creates a `Equals` expression that will compare for value equality */
  export function Equals<T extends Equatable>(value: T, options: ExpressionOptions = {}): EqualsExpression<T> {
    return { ...options, type: 'Equals', value };
  }
  /** Creates a `Function` expression which invokes the given callback to check a value */
  export function Function<F extends (value: unknown) => boolean>(
    callback: F,
    options: ExpressionOptions = {},
  ): FunctionExpression<F> {
    return { ...options, type: 'Function', callback };
  }
  /** Creates a `ElementsDistinct` expression which will check an arrays elements are structurally distinct  */
  export function ElementsDistinct(options: ExpressionOptions = {}): ElementsDistinctExpression {
    return { ...options, type: 'ElementsDistinct' };
  }
  /** Creates a `Elements` expression that will check an arrays elements for the given sub expression */
  export function Elements<E extends Expression>(
    expression: E,
    options: ExpressionOptions = {},
  ): ElementsExpression<E> {
    return { ...options, type: 'Elements', expr: expression };
  }
  /** Creates a `False` expression that evaluates `false` */
  export function False(options: ExpressionOptions = {}): FalseExpression {
    return { ...options, type: 'False' };
  }
  /** Creates a `GreaterThanEqual` comparison expression */
  export function GreaterThanEqual<T extends Compariable>(
    value: T,
    options: ExpressionOptions = {},
  ): GreaterThanEqualExpression<T> {
    return { ...options, type: 'GreaterThanEqual', value };
  }
  /** Creates a `GreaterThan` comparison expression */
  export function GreaterThan<T extends Compariable>(
    value: T,
    options: ExpressionOptions = {},
  ): GreaterThanExpression<T> {
    return { ...options, type: 'GreaterThan', value };
  }
  /** Creates a `IfThenElse` expression that will evaluate the `$if` expression followed by either the `$then` of `$else` expressions */
  export function IfThenElse(
    $if: Expression,
    $then: Expression,
    $else: Expression,
    options: ExpressionOptions = {},
  ): IfThenElseExpression {
    return { ...options, type: 'IfThenElse', if: $if, then: $then, else: $else };
  }
  /** Creates a `Index` expression that will evaluate an array element by the given sub expression */
  export function Index<E extends Expression, I extends number>(
    index: I,
    expression: E,
    options: ExpressionOptions = {},
  ): IndexExpression<E, I> {
    return { ...options, type: 'Index', index, expr: expression };
  }
  /** Creates a `InstanceOf` expression that will apply the `instanceof` operator */
  export function InstanceOf<T extends string>(value: T, options: ExpressionOptions = {}): InstanceOfExpression<T> {
    return { ...options, type: 'InstanceOf', value };
  }
  /** Creates a `IsArray` expression that will check a value as an array */
  export function IsArray(options: ExpressionOptions = {}): IsArrayExpression {
    return { ...options, type: 'IsArray' };
  }
  /** Creates a `IsNaN` expression that will check for NaN */
  export function IsNaN(options: ExpressionOptions = {}): IsNaNExpression {
    return { ...options, type: 'IsNaN' };
  }
  /** Creates a `IsInteger` expression that will check for numeric integer values */
  export function IsInteger(options: ExpressionOptions = {}): IsIntegerExpression {
    return { ...options, type: 'IsInteger' };
  }
  /** Creates a `IsObject` expression that will check a value as an object */
  export function IsObject(options: ExpressionOptions = {}): IsObjectExpression {
    return Expression.TypeOf('object', options);
  }
  /** Creates a `IsBigInt` expression that will check a value as a bigint */
  export function IsBigInt(options: ExpressionOptions = {}): IsBigIntExpression {
    return Expression.TypeOf('bigint', options);
  }
  /** Creates a `IsBoolean` expression that will check a value as a boolean */
  export function IsBoolean(options: ExpressionOptions = {}): IsBooleanExpression {
    return Expression.TypeOf('boolean', options);
  }
  /** Creates a `IsFinite` expression that will check a numeric value if finite */
  export function IsFinite(options: ExpressionOptions = {}): IsFiniteExpression {
    return { ...options, type: 'IsFinite' };
  }
  /** Creates a `IsFunction` expression that will check a value as a function */
  export function IsFunction(options: ExpressionOptions = {}): IsFunctionExpression {
    return Expression.TypeOf('function', options);
  }
  /** Creates a `IsNumber` expression that will check a value as a number */
  export function IsNumber(options: ExpressionOptions = {}): IsNumberExpression {
    return Expression.TypeOf('number', options);
  }
  /** Creates a `IsSafeInteger` expression that will check a numeric value if finite */
  export function IsSafeInteger(options: ExpressionOptions = {}): IsSafeIntegerExpression {
    return { ...options, type: 'IsSafeInteger' };
  }
  /** Creates a `IsString` expression that will check a value as a string */
  export function IsString(options: ExpressionOptions = {}): IsStringExpression {
    return Expression.TypeOf('string', options);
  }
  /** Creates a `IsSymbol` expression that will check a value as a symbol */
  export function IsSymbol(options: ExpressionOptions = {}): IsSymbolExpression {
    return Expression.TypeOf('symbol', options);
  }
  /** Creates a `IsUndefined` expression that will check a value is undefined */
  export function IsUndefined(options: ExpressionOptions = {}): IsUndefinedExpression {
    return { ...options, type: 'IsUndefined' };
  }
  /** Creates a `IsNull` expression that will check a value is null */
  export function IsNull(options: ExpressionOptions = {}): IsNullExpression {
    return Expression.Equals(null, options);
  }
  /** Creates a `IsPattern` expression that will check a string with a regular expression */
  export function IsPattern(pattern: string, options: ExpressionOptions = {}): IsPatternExpression {
    return { ...options, type: 'IsPattern', pattern };
  }
  /** Creates a KeyIn expression that will check if a key exists on this value */
  export function KeyIn<T extends string>(value: T, options: ExpressionOptions = {}): KeyInExpression<T> {
    return { ...options, type: 'KeyIn', value };
  }
  /** Creates a `LessThanEqual` comparison expression */
  export function LessThanEqual<T extends Compariable>(
    value: T,
    options: ExpressionOptions = {},
  ): LessThanEqualExpression<T> {
    return { ...options, type: 'LessThanEqual', value };
  }
  /** Creates a `LessThan` comparison expression */
  export function LessThan<T extends Compariable>(value: T, options: ExpressionOptions = {}): LessThanExpression<T> {
    return { ...options, type: 'LessThan', value };
  }
  /** Creates a `MultipleOf` modulus expression that is true if the result is zero */
  export function MultipleOf<T extends number>(value: T, options: ExpressionOptions = {}): MultipleOfExpression<T> {
    return { ...options, type: 'MultipleOf', value };
  }
  /** Creates a `Not` expression where the result of the sub expression is inverted */
  export function Not<E extends Expression>(expression: E, options: ExpressionOptions = {}): NotExpression<E> {
    return { ...options, type: 'Not', expr: expression };
  }
  /** Creates a `Or` expression where each sub expression is evaluated in sequence */
  export function Or<E extends Expression>(
    expressions: (() => Generator<E>) | Array<E>,
    options: ExpressionOptions = {},
  ): Expression {
    const expr = globalThis.Array.isArray(expressions) ? expressions : [...expressions()];
    if (expr.length === 0) return Expression.False();
    if (expr.length === 1) return expr[0];
    return { ...options, type: 'Or', expr };
  }
  /** Creates a `PropertiesExcludePattern` expression that will enumerate each key matching the given regular expression */
  export function PropertiesExcludePattern<E extends Expression>(
    pattern: string,
    expression: E,
    options: ExpressionOptions = {},
  ): PropertiesExcludePatternExpression<E> {
    return { ...options, type: 'PropertiesExcludePattern', expr: expression, pattern };
  }
  /** Creates a `PropertiesExclude` expression that will enumerate the unselected keys and check each for the sub expression */
  export function PropertiesExclude<E extends Expression, K extends string[]>(
    keys: K,
    expression: E,
    options: ExpressionOptions = {},
  ): PropertiesExcludeExpression<E, K> {
    return { ...options, type: 'PropertiesExclude', expr: expression, keys };
  }
  /** Creates a `PropertiesIncludePattern` expression that will enumerate each key matching the given regular expression */
  export function PropertiesIncludePattern<E extends Expression>(
    pattern: string,
    expression: E,
    options: ExpressionOptions = {},
  ): PropertiesIncludePatternExpression<E> {
    return { ...options, type: 'PropertiesIncludePattern', expr: expression, pattern };
  }
  /** Creates a `PropertiesInclude` expression that will enumerate the selected keys and check each for the sub expression */
  export function PropertiesInclude<E extends Expression, K extends string[]>(
    keys: K,
    expression: E,
    options: ExpressionOptions = {},
  ): PropertiesIncludeExpression<E, K> {
    return { ...options, type: 'PropertiesInclude', expr: expression, keys };
  }
  /** Creates a `PropertiesLength` expression that checks an object a property length that equals the given value */
  export function PropertiesLength<T extends number>(
    value: T,
    options: ExpressionOptions = {},
  ): PropertiesLengthExpression<T> {
    return { ...options, type: 'PropertiesLength', value };
  }
  /** Creates a `PropertiesMaximum` expression that will check an object has a property length less or equal the given value */
  export function PropertiesMaximum<T extends number>(
    value: T,
    options: ExpressionOptions = {},
  ): PropertiesMaximumExpression<T> {
    return { ...options, type: 'PropertiesMaximum', value };
  }
  /** Creates a `PropertiesMinimum` expression that will check an object has a property length greater or equal the given value */
  export function PropertiesMinimum<T extends number>(
    value: T,
    options: ExpressionOptions = {},
  ): PropertiesMinimumExpression<T> {
    return { ...options, type: 'PropertiesMinimum', value };
  }
  /** Creates a `Properties` expression that will enumerate all object properties and check for the given sub expression */
  export function Properties<E extends Expression>(
    expression: E,
    options: ExpressionOptions = {},
  ): PropertiesExpression<E> {
    return { ...options, type: 'Properties', expr: expression };
  }
  /** Creates a `PropertyKeys` expression that will check an object has the specified keys */
  export function PropertyKeys<T extends string[]>(
    keys: T,
    options: ExpressionOptions = {},
  ): PropertyKeysExpression<T> {
    return { ...options, type: 'PropertyKeys', keys };
  }
  /** Creates a `Property` expression that will evaluate the property value by the given sub expression */
  export function Property<E extends Expression, K extends string>(
    key: K,
    expression: E,
    options: ExpressionOptions = {},
  ): PropertyExpression<E, K> {
    return { ...options, type: 'Property', key, expr: expression };
  }
  /** Creates a `Ref` that will reference another part of the expression tree via $id */
  export function Ref<T extends string>(value: T, options: ExpressionOptions = {}): RefExpression<T> {
    return { ...options, type: 'Ref', $ref: value };
  }
  /** Creates a `True` expression that evaluates `true` */
  export function True(options: ExpressionOptions = {}): TrueExpression {
    return { ...options, type: 'True' };
  }
  /** Creates a `TypeOf` expression that will apply `typeof` operator for the evaluated value */
  export function TypeOf<E extends TypeOf>(value: E, options: ExpressionOptions = {}): TypeOfExpression<E> {
    return { ...options, type: 'TypeOf', value };
  }
}
