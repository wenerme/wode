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
import { Hash } from '@sinclair/typebox/value';
import * as Expr from './expression';

// ---------------------------------------------------------------------
// ExpressionErrorsEvaluator
// ---------------------------------------------------------------------

export class ExpressionErrorsUnknownExpressionError extends Error {
  constructor(public readonly expression: unknown) {
    super('Unknown Expression Detected');
  }
}

export namespace ExpressionErrors {
  function And(expression: Expr.AndExpression, path: string, value: unknown): boolean {
    return expression.expr.every((expression) => Visit(expression, path, value));
  }
  function Call(expression: Expr.CallExpression, path: string, value: Record<string, Function>): boolean {
    const func = value[expression.target].bind(value);
    return typeof func === 'function' && Visit(expression.expr, path, func(...expression.parameters));
  }
  function ElementsDistinct(expression: Expr.ElementsDistinctExpression, path: string, value: unknown[]): boolean {
    const set = new Set();
    for (const element of value) {
      const hash = Hash(element);
      if (set.has(hash)) return false;
      set.add(hash);
    }
    return true;
  }
  function Elements(expression: Expr.ElementsExpression, path: string, value: unknown[]): boolean {
    return value.every((element) => Visit(expression.expr, path, element));
  }
  function Equals(expression: Expr.EqualsExpression, path: string, value: unknown): boolean {
    return value === expression.value;
  }
  function False(expression: Expr.FalseExpression, path: string, value: unknown): boolean {
    return false;
  }
  function Function(expression: Expr.FunctionExpression, path: string, value: unknown): boolean {
    return expression.callback(value);
  }
  function GreaterThanEqual(expression: Expr.GreaterThanEqualExpression, path: string, value: number): boolean {
    return value >= expression.value;
  }
  function GreaterThan(expression: Expr.GreaterThanExpression, path: string, value: number): boolean {
    return value > expression.value;
  }
  function IfThenElse(expression: Expr.IfThenElseExpression, path: string, value: unknown): boolean {
    return Visit(expression.if, path, value)
      ? Visit(expression.then, path, value)
      : Visit(expression.else, path, value);
  }
  function InstanceOf(expression: Expr.InstanceOfExpression, path: string, value: unknown): boolean {
    return value instanceof (expression.value as any);
  }
  function IsArray(expression: Expr.IsArrayExpression, path: string, value: unknown[]): boolean {
    return globalThis.Array.isArray(value);
  }
  function IsInteger(expression: Expr.IsIntegerExpression, path: string, value: number): boolean {
    return globalThis.Number.isInteger(value);
  }
  function IsNaN(expression: Expr.IsNaNExpression, path: string, value: number): boolean {
    return globalThis.Number.isNaN(value);
  }
  function IsFinite(expression: Expr.IsFiniteExpression, path: string, value: number): boolean {
    return globalThis.Number.isFinite(value);
  }
  function IsPattern(expression: Expr.IsPatternExpression, path: string, value: string): boolean {
    const regexp = new globalThis.RegExp(expression.pattern);
    return regexp.test(value);
  }
  function IsSafeInteger(expression: Expr.IsSafeIntegerExpression, path: string, value: number): boolean {
    return globalThis.Number.isSafeInteger(value);
  }
  function IsUndefined(expression: Expr.IsUndefinedExpression, path: string, value: number): boolean {
    return value === undefined;
  }
  function LessThan(expression: Expr.LessThanExpression, path: string, value: number): boolean {
    return value < expression.value;
  }
  function LessThanEqual(expression: Expr.LessThanEqualExpression, path: string, value: number): boolean {
    return value <= expression.value;
  }
  function MultipleOf(expression: Expr.MultipleOfExpression, path: string, value: number): boolean {
    return value % expression.value === 0;
  }
  function Property(expression: Expr.PropertyExpression, path: string, value: Record<string, unknown>): boolean {
    return Visit(expression.expr, path, value[expression.key]);
  }
  function Index(expression: Expr.IndexExpression, path: string, value: unknown[]): boolean {
    return Visit(expression.expr, path, value[expression.index]);
  }
  function Or(expression: Expr.OrExpression, path: string, value: unknown): boolean {
    return expression.expr.some((expression) => Visit(expression, path, value));
  }
  function Not(expression: Expr.NotExpression, path: string, value: unknown): boolean {
    return !Visit(expression.expr, path, value);
  }
  function PropertiesExcludePattern(
    expression: Expr.PropertiesExcludePatternExpression,
    path: string,
    value: Record<string, unknown>,
  ): boolean {
    const regexp = new globalThis.RegExp(expression.pattern);
    return Object.getOwnPropertyNames(value).every((key) =>
      !regexp.test(key) ? Visit(expression.expr, path, value[key]) : true,
    );
  }
  function PropertiesExclude(
    expression: Expr.PropertiesExcludeExpression,
    path: string,
    value: Record<string, unknown>,
  ): boolean {
    return Object.getOwnPropertyNames(value).every((key) =>
      !expression.keys.includes(key) ? Visit(expression.expr, path, value[key]) : true,
    );
  }
  function PropertiesIncludePattern(
    expression: Expr.PropertiesIncludePatternExpression,
    path: string,
    value: Record<string, unknown>,
  ): boolean {
    const regexp = new globalThis.RegExp(expression.pattern);
    return Object.getOwnPropertyNames(value).every((key) =>
      regexp.test(key) ? Visit(expression.expr, path, value[key]) : true,
    );
  }
  function PropertiesInclude(
    expression: Expr.PropertiesIncludeExpression,
    path: string,
    value: Record<string, unknown>,
  ): boolean {
    return Object.getOwnPropertyNames(value).every((key) =>
      expression.keys.includes(key) ? Visit(expression.expr, path, value[key]) : true,
    );
  }
  function PropertiesLength(
    expression: Expr.PropertiesLengthExpression,
    path: string,
    value: Record<string, unknown>,
  ): boolean {
    return globalThis.Object.getOwnPropertyNames(value).length === expression.value;
  }
  function PropertiesMaximum(
    expression: Expr.PropertiesMaximumExpression,
    path: string,
    value: Record<string, unknown>,
  ): boolean {
    return globalThis.Object.getOwnPropertyNames(value).length <= expression.value;
  }
  function PropertiesMinimum(
    expression: Expr.PropertiesMinimumExpression,
    path: string,
    value: Record<string, unknown>,
  ): boolean {
    return globalThis.Object.getOwnPropertyNames(value).length >= expression.value;
  }
  function Properties(expression: Expr.PropertiesExpression, path: string, value: Record<string, unknown>): boolean {
    return globalThis.Object.getOwnPropertyNames(value).every((key) => Visit(expression.expr, path, value[key]));
  }
  function PropertyKeys(
    expression: Expr.PropertyKeysExpression,
    path: string,
    value: Record<string, unknown>,
  ): boolean {
    const keys = globalThis.Object.getOwnPropertyNames(value);
    return expression.keys.every((key) => keys.includes(key));
  }
  function Ref(expression: Expr.RefExpression, path: string, value: unknown): boolean {
    if (!reference_map.has(expression.$ref)) return false;
    const referenced_expression = reference_map.get(expression.$ref)!;
    return Visit(referenced_expression, path, value);
  }
  function True(expression: Expr.TrueExpression, path: string, value: unknown): boolean {
    return true;
  }
  function TypeOf(expression: Expr.TypeOfExpression, path: string, value: unknown): boolean {
    return typeof value === expression.value;
  }
  function Visit(expression: Expr.Expression, path: string, value: any): boolean {
    if (expression.$id !== undefined) reference_map.set(expression.$id, expression);
    switch (expression.type) {
      case 'And':
        return And(expression, path, value);
      case 'Call':
        return Call(expression, path, value);
      case 'ElementsDistinct':
        return ElementsDistinct(expression, path, value);
      case 'Elements':
        return Elements(expression, path, value);
      case 'Equals':
        return Equals(expression, path, value);
      case 'False':
        return False(expression, path, value);
      case 'Function':
        return Function(expression, path, value);
      case 'GreaterThanEqual':
        return GreaterThanEqual(expression, path, value);
      case 'GreaterThan':
        return GreaterThan(expression, path, value);
      case 'LessThanEqual':
        return LessThanEqual(expression, path, value);
      case 'LessThan':
        return LessThan(expression, path, value);
      case 'MultipleOf':
        return MultipleOf(expression, path, value);
      case 'IfThenElse':
        return IfThenElse(expression, path, value);
      case 'InstanceOf':
        return InstanceOf(expression, path, value);
      case 'Index':
        return Index(expression, path, value);
      case 'IsArray':
        return IsArray(expression, path, value);
      case 'IsFinite':
        return IsFinite(expression, path, value);
      case 'IsInteger':
        return IsInteger(expression, path, value);
      case 'IsNaN':
        return IsNaN(expression, path, value);
      case 'IsPattern':
        return IsPattern(expression, path, value);
      case 'IsSafeInteger':
        return IsSafeInteger(expression, path, value);
      case 'IsUndefined':
        return IsUndefined(expression, path, value);
      case 'Not':
        return Not(expression, path, value);
      case 'Or':
        return Or(expression, path, value);
      case 'PropertiesInclude':
        return PropertiesInclude(expression, path, value);
      case 'PropertiesIncludePattern':
        return PropertiesIncludePattern(expression, path, value);
      case 'PropertiesExclude':
        return PropertiesExclude(expression, path, value);
      case 'PropertiesExcludePattern':
        return PropertiesExcludePattern(expression, path, value);
      case 'PropertiesLength':
        return PropertiesLength(expression, path, value);
      case 'PropertiesMaximum':
        return PropertiesMaximum(expression, path, value);
      case 'PropertiesMinimum':
        return PropertiesMinimum(expression, path, value);
      case 'Properties':
        return Properties(expression, path, value);
      case 'PropertyKeys':
        return PropertyKeys(expression, path, value);
      case 'Property':
        return Property(expression, path, value);
      case 'Ref':
        return Ref(expression, path, value);
      case 'True':
        return True(expression, path, value);
      case 'TypeOf':
        return TypeOf(expression, path, value);
      default:
        throw 1;
    }
  }
  const reference_map = new Map<string, Expr.Expression>();
  const error_map = new Map<string, string>();

  /** Evaluates an expression against a value and returns an `ExpressionResult<T>` which contains a `path` and `ok` property  */
  export function Evaluate(expression: Expr.Expression, references: Expr.Expression[], value: unknown) {
    reference_map.clear();
    error_map.clear();
    for (const reference of references) {
      if (reference.$id === undefined) continue;
      reference_map.set(reference.$id, reference);
    }
    return Visit(expression, '', value);
  }
}
