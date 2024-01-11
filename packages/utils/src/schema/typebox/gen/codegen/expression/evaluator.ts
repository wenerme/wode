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

export class ExpressionEvaluatorExpressionError extends Error {
  constructor(public readonly expression: unknown) {
    super('Unknown Expression Detected');
  }
}

export namespace ExpressionEvaluator {
  function And(expression: Expr.AndExpression, value: unknown): boolean {
    return expression.expr.every((expression) => Visit(expression, value));
  }
  function Call(expression: Expr.CallExpression, value: Record<string, Function>): boolean {
    const func = value[expression.target].bind(value);
    return typeof func === 'function' && Visit(expression.expr, func(...expression.parameters));
  }
  function ElementsDistinct(expression: Expr.ElementsDistinctExpression, value: unknown[]): boolean {
    const set = new Set();
    for (const element of value) {
      const hash = Hash(element);
      if (set.has(hash)) return false;
      set.add(hash);
    }
    return true;
  }
  function Elements(expression: Expr.ElementsExpression, value: unknown[]): boolean {
    return value.every((element) => Visit(expression.expr, element));
  }
  function Equals(expression: Expr.EqualsExpression, value: unknown): boolean {
    return value === expression.value;
  }
  function False(expression: Expr.FalseExpression, value: unknown): boolean {
    return false;
  }
  function Function(expression: Expr.FunctionExpression, value: unknown): boolean {
    return expression.callback(value);
  }
  function GreaterThanEqual(expression: Expr.GreaterThanEqualExpression, value: number): boolean {
    return value >= expression.value;
  }
  function GreaterThan(expression: Expr.GreaterThanExpression, value: number): boolean {
    return value > expression.value;
  }
  function IfThenElse(expression: Expr.IfThenElseExpression, value: unknown): boolean {
    return Visit(expression.if, value) ? Visit(expression.then, value) : Visit(expression.else, value);
  }
  function InstanceOf(expression: Expr.InstanceOfExpression, value: unknown): boolean {
    return value instanceof (globalThis as any)[expression.value];
  }
  function IsArray(expression: Expr.IsArrayExpression, value: unknown[]): boolean {
    return globalThis.Array.isArray(value);
  }
  function IsInteger(expression: Expr.IsIntegerExpression, value: number): boolean {
    return globalThis.Number.isInteger(value);
  }
  function IsNaN(expression: Expr.IsNaNExpression, value: number): boolean {
    return globalThis.Number.isNaN(value);
  }
  function IsFinite(expression: Expr.IsFiniteExpression, value: number): boolean {
    return globalThis.Number.isFinite(value);
  }
  function IsPattern(expression: Expr.IsPatternExpression, value: string): boolean {
    const regexp = new globalThis.RegExp(expression.pattern);
    return regexp.test(value);
  }
  function IsSafeInteger(expression: Expr.IsSafeIntegerExpression, value: number): boolean {
    return globalThis.Number.isSafeInteger(value);
  }
  function IsUndefined(expression: Expr.IsUndefinedExpression, value: number): boolean {
    return value === undefined;
  }
  function LessThan(expression: Expr.LessThanExpression, value: number): boolean {
    return value < expression.value;
  }
  function LessThanEqual(expression: Expr.LessThanEqualExpression, value: number): boolean {
    return value <= expression.value;
  }
  function MultipleOf(expression: Expr.MultipleOfExpression, value: number): boolean {
    return value % expression.value === 0;
  }
  function Property(expression: Expr.PropertyExpression, value: Record<string, unknown>): boolean {
    return Visit(expression.expr, value[expression.key]);
  }
  function Index(expression: Expr.IndexExpression, value: unknown[]): boolean {
    return Visit(expression.expr, value[expression.index]);
  }
  function Or(expression: Expr.OrExpression, value: unknown): boolean {
    return expression.expr.some((expression) => Visit(expression, value));
  }
  function Not(expression: Expr.NotExpression, value: unknown): boolean {
    return !Visit(expression.expr, value);
  }
  function PropertiesExcludePattern(
    expression: Expr.PropertiesExcludePatternExpression,
    value: Record<string, unknown>,
  ): boolean {
    const regexp = new globalThis.RegExp(expression.pattern);
    return Object.getOwnPropertyNames(value).every((key) =>
      !regexp.test(key) ? Visit(expression.expr, value[key]) : true,
    );
  }
  function PropertiesExclude(expression: Expr.PropertiesExcludeExpression, value: Record<string, unknown>): boolean {
    return Object.getOwnPropertyNames(value).every((key) =>
      !expression.keys.includes(key) ? Visit(expression.expr, value[key]) : true,
    );
  }
  function PropertiesIncludePattern(
    expression: Expr.PropertiesIncludePatternExpression,
    value: Record<string, unknown>,
  ): boolean {
    const regexp = new globalThis.RegExp(expression.pattern);
    return Object.getOwnPropertyNames(value).every((key) =>
      regexp.test(key) ? Visit(expression.expr, value[key]) : true,
    );
  }
  function PropertiesInclude(expression: Expr.PropertiesIncludeExpression, value: Record<string, unknown>): boolean {
    return Object.getOwnPropertyNames(value).every((key) =>
      expression.keys.includes(key) ? Visit(expression.expr, value[key]) : true,
    );
  }
  function PropertiesLength(expression: Expr.PropertiesLengthExpression, value: Record<string, unknown>): boolean {
    return globalThis.Object.getOwnPropertyNames(value).length === expression.value;
  }
  function PropertiesMaximum(expression: Expr.PropertiesMaximumExpression, value: Record<string, unknown>): boolean {
    return globalThis.Object.getOwnPropertyNames(value).length <= expression.value;
  }
  function PropertiesMinimum(expression: Expr.PropertiesMinimumExpression, value: Record<string, unknown>): boolean {
    return globalThis.Object.getOwnPropertyNames(value).length >= expression.value;
  }
  function Properties(expression: Expr.PropertiesExpression, value: Record<string, unknown>): boolean {
    return globalThis.Object.getOwnPropertyNames(value).every((key) => Visit(expression.expr, value[key]));
  }
  function PropertyKeys(expression: Expr.PropertyKeysExpression, value: Record<string, unknown>): boolean {
    const keys = globalThis.Object.getOwnPropertyNames(value);
    return expression.keys.every((key) => keys.includes(key));
  }

  function Ref(expression: Expr.RefExpression, value: unknown): boolean {
    if (!reference_map.has(expression.$ref)) return false;
    const referenced_expression = reference_map.get(expression.$ref)!;
    return Visit(referenced_expression, value);
  }
  function True(expression: Expr.TrueExpression, value: unknown): boolean {
    return true;
  }
  function TypeOf(expression: Expr.TypeOfExpression, value: unknown): boolean {
    return typeof value === expression.value;
  }
  function Visit(expression: Expr.Expression, value: any): boolean {
    if (expression.$id !== undefined) reference_map.set(expression.$id, expression);
    switch (expression.type) {
      case 'And':
        return And(expression, value);
      case 'Call':
        return Call(expression, value);
      case 'ElementsDistinct':
        return ElementsDistinct(expression, value);
      case 'Elements':
        return Elements(expression, value);
      case 'Equals':
        return Equals(expression, value);
      case 'False':
        return False(expression, value);
      case 'Function':
        return Function(expression, value);
      case 'GreaterThanEqual':
        return GreaterThanEqual(expression, value);
      case 'GreaterThan':
        return GreaterThan(expression, value);
      case 'LessThanEqual':
        return LessThanEqual(expression, value);
      case 'LessThan':
        return LessThan(expression, value);
      case 'MultipleOf':
        return MultipleOf(expression, value);
      case 'IfThenElse':
        return IfThenElse(expression, value);
      case 'InstanceOf':
        return InstanceOf(expression, value);
      case 'Index':
        return Index(expression, value);
      case 'IsArray':
        return IsArray(expression, value);
      case 'IsFinite':
        return IsFinite(expression, value);
      case 'IsInteger':
        return IsInteger(expression, value);
      case 'IsNaN':
        return IsNaN(expression, value);
      case 'IsPattern':
        return IsPattern(expression, value);
      case 'IsSafeInteger':
        return IsSafeInteger(expression, value);
      case 'IsUndefined':
        return IsUndefined(expression, value);
      case 'Not':
        return Not(expression, value);
      case 'Or':
        return Or(expression, value);
      case 'PropertiesInclude':
        return PropertiesInclude(expression, value);
      case 'PropertiesIncludePattern':
        return PropertiesIncludePattern(expression, value);
      case 'PropertiesExclude':
        return PropertiesExclude(expression, value);
      case 'PropertiesExcludePattern':
        return PropertiesExcludePattern(expression, value);
      case 'PropertiesLength':
        return PropertiesLength(expression, value);
      case 'PropertiesMaximum':
        return PropertiesMaximum(expression, value);
      case 'PropertiesMinimum':
        return PropertiesMinimum(expression, value);
      case 'Properties':
        return Properties(expression, value);
      case 'PropertyKeys':
        return PropertyKeys(expression, value);
      case 'Property':
        return Property(expression, value);
      case 'Ref':
        return Ref(expression, value);
      case 'True':
        return True(expression, value);
      case 'TypeOf':
        return TypeOf(expression, value);
      default:
        throw new ExpressionEvaluatorExpressionError(expression);
    }
  }
  const reference_map = new Map<string, Expr.Expression>();
  /** Evaluates the given expression */
  export function Evaluate(expression: Expr.Expression, references: Expr.Expression[], value: unknown): boolean {
    reference_map.clear();
    for (const reference of references) {
      if (reference.$id === undefined) continue;
      reference_map.set(reference.$id, reference);
    }
    return Visit(expression, value);
  }
}
