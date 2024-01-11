/*--------------------------------------------------------------------------

@sinclair/typebox-codegen

The MIT License (MIT)

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
import * as Types from '@sinclair/typebox';
import { TypeSystem, TypeSystemPolicy } from '@sinclair/typebox/system';
import { Formatter } from '../common/formatter';
import { Expression } from '../expression/index';
import { TypeBoxModel } from './model';

export class TypeTransformUnknownSchemaError extends Error {
  constructor(public readonly schema: unknown) {
    super('TypeTransformUnknownSchemaError: Unknown schema');
  }
}
export namespace TypeBoxToExpression {
  // --------------------------------------------------------------
  // Guards
  // --------------------------------------------------------------
  function IsArray(value: unknown): value is unknown[] {
    return globalThis.Array.isArray(value);
  }
  function IsObject(value: unknown): value is object {
    return typeof value === 'object' && !IsArray(value);
  }
  function IsNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value);
  }
  function IsString(value: unknown): value is string {
    return typeof value === 'string';
  }
  function IsUndefined(value: unknown): value is undefined {
    return value === undefined;
  }

  // --------------------------------------------------------------
  // Conditional: If Then Else
  // --------------------------------------------------------------
  // function* Conditional(schema: Types.TSchema, references: Types.TSchema[]): IterableIterator<Expression> {
  //   if (IsUndefined(schema.if)) return
  //   const if_expression = Visit(schema.if, references)
  //   const then_expression = IsUndefined(schema.then) ? Expression.True() : Visit(schema.then, references)
  //   const else_expression = IsUndefined(schema.else) ? Expression.True() : Visit(schema.else, references)
  //   yield Expression.IfThenElse(if_expression, then_expression, else_expression)
  // }

  // --------------------------------------------------------------
  // Transform
  // --------------------------------------------------------------
  function Any(schema: Types.TAny, references: Types.TSchema[]): Expression {
    return Expression.True({ $id: schema.$id });
  }
  function Array(schema: Types.TArray, references: Types.TSchema[]) {
    return Expression.And(
      function* () {
        yield Expression.IsArray();
        if (IsNumber(schema.maxItems)) yield Expression.Property('length', Expression.LessThanEqual(schema.maxItems));
        if (IsNumber(schema.minItems))
          yield Expression.Property('length', Expression.GreaterThanEqual(schema.minItems));
        yield Expression.Elements(Visit(schema.items, references));
        if (schema.uniqueItems === true) yield Expression.ElementsDistinct();
      },
      { $id: schema.$id },
    );
  }
  function Boolean(schema: Types.TBoolean, references: Types.TSchema[]): Expression {
    return Expression.IsBoolean({ $id: schema.$id });
  }
  function Constructor(schema: Types.TConstructor, references: Types.TSchema[]): Expression {
    return Expression.Property('prototype', Visit(schema.returns, references), { $id: schema.$id });
  }
  function Date(schema: Types.TDate, references: Types.TSchema[]): Expression {
    return Expression.And(
      function* () {
        yield Expression.InstanceOf('Date');
        if (IsNumber(schema.maximumTimestamp))
          yield Expression.Call('getTime', [], Expression.LessThanEqual(schema.maximumTimestamp));
        if (IsNumber(schema.minimumTimestamp))
          yield Expression.Call('getTime', [], Expression.GreaterThanEqual(schema.minimumTimestamp));
        if (IsNumber(schema.exclusiveMaximumTimestamp))
          yield Expression.Call('getTime', [], Expression.LessThan(schema.exclusiveMaximumTimestamp));
        if (IsNumber(schema.exclusiveMinimumTimestamp))
          yield Expression.Call('getTime', [], Expression.GreaterThan(schema.exclusiveMinimumTimestamp));
      },
      { $id: schema.$id },
    );
  }
  function Function(schema: Types.TFunction, references: Types.TSchema[]): Expression {
    return Expression.IsFunction({ $id: schema.$id });
  }
  function Intersect(schema: Types.TIntersect, references: Types.TSchema[]): Expression {
    return Expression.And(
      function* () {
        for (const inner of schema.allOf) {
          yield Visit(inner, references);
        }
      },
      { $id: schema.$id },
    );
  }
  function Integer(schema: Types.TInteger, references: Types.TSchema[]): Expression {
    return Expression.And(
      function* () {
        yield Expression.IsInteger();
        if (IsNumber(schema.multipleOf)) yield Expression.MultipleOf(schema.multipleOf);
        if (IsNumber(schema.maximum)) yield Expression.LessThanEqual(schema.maximum);
        if (IsNumber(schema.minimum)) yield Expression.GreaterThanEqual(schema.minimum);
        if (IsNumber(schema.exclusiveMaximum)) yield Expression.LessThan(schema.exclusiveMaximum);
        if (IsNumber(schema.exclusiveMinimum)) yield Expression.GreaterThan(schema.exclusiveMinimum);
      },
      { $id: schema.$id },
    );
  }
  function Literal(schema: Types.TLiteral, references: Types.TSchema[]): Expression {
    return Expression.Equals(schema.const, { $id: schema.$id });
  }
  function Never(schema: Types.TNever, references: Types.TSchema[]): Expression {
    return Expression.False({ $id: schema.$id });
  }
  function Null(schema: Types.TNull, references: Types.TSchema[]): Expression {
    return Expression.IsNull({ $id: schema.$id });
  }
  function Number(schema: Types.TNumber, references: Types.TSchema[]): Expression {
    return Expression.And(
      function* () {
        yield Expression.IsNumber();
        if (TypeSystemPolicy.AllowNaN === false) yield Expression.IsFinite();
        if (IsNumber(schema.multipleOf)) yield Expression.MultipleOf(schema.multipleOf);
        if (IsNumber(schema.maximum)) yield Expression.LessThanEqual(schema.maximum);
        if (IsNumber(schema.minimum)) yield Expression.GreaterThanEqual(schema.minimum);
        if (IsNumber(schema.exclusiveMaximum)) yield Expression.LessThan(schema.exclusiveMaximum);
        if (IsNumber(schema.exclusiveMinimum)) yield Expression.GreaterThan(schema.exclusiveMinimum);
      },
      { $id: schema.$id },
    );
  }
  function Object(schema: Types.TObject, references: Types.TSchema[]): Expression {
    const propertyKeys = globalThis.Object.getOwnPropertyNames(schema.properties);
    const requiredKeys = IsArray(schema.required) ? schema.required : [];
    const optionalKeys = new Set(propertyKeys);
    requiredKeys.forEach((key) => optionalKeys.delete(key));
    return Expression.And(
      function* () {
        yield Expression.IsObject();
        yield Expression.Not(Expression.IsNull());
        if (TypeSystemPolicy.AllowArrayObject === false) yield Expression.Not(Expression.IsArray());
        if (IsNumber(schema.minProperties)) yield Expression.PropertiesMinimum(schema.minProperties);
        if (IsNumber(schema.maxProperties)) yield Expression.PropertiesMaximum(schema.maxProperties);
        if (schema.additionalProperties === false) {
          if (schema.required && schema.required.length === propertyKeys.length) {
            yield Expression.PropertiesLength(propertyKeys.length);
          } else {
            yield Expression.PropertiesExclude(propertyKeys, Expression.False());
          }
        }
        if (IsObject(schema.additionalProperties)) {
          yield Expression.PropertiesExclude(propertyKeys, Visit(schema.additionalProperties, references));
        }
        for (const propertyKey of requiredKeys) {
          yield Expression.Property(propertyKey, Visit(schema.properties[propertyKey], references));
        }
        for (const propertyKey of optionalKeys) {
          yield Expression.Or(function* () {
            yield Expression.Not(Expression.KeyIn(propertyKey));
            yield Expression.Property(
              propertyKey,
              Expression.Or(function* () {
                yield Expression.Not(Expression.KeyIn(propertyKey));
                yield Visit(schema.properties[propertyKey], references);
              }),
            );
          });
        }
      },
      { $id: schema.$id },
    );
  }
  function Promise(schema: Types.TPromise, references: Types.TSchema[]): Expression {
    return Expression.And(
      function* () {
        yield Expression.IsObject();
        yield Expression.Property('then', Expression.IsFunction());
      },
      { $id: schema.$id },
    );
  }
  function Record(schema: Types.TRecord, references: Types.TSchema[]): Expression {
    const [keyPattern, valueSchema] = globalThis.Object.entries(schema.patternProperties)[0];
    return Expression.And(
      function* () {
        yield Expression.IsObject();
        yield Expression.Not(Expression.IsNull());
        yield Expression.Not(Expression.InstanceOf('Date'));
        if (IsNumber(schema.minProperties)) yield Expression.PropertiesMinimum(schema.minProperties);
        if (IsNumber(schema.maxProperties)) yield Expression.PropertiesMaximum(schema.maxProperties);
        yield Expression.PropertiesIncludePattern(keyPattern, Visit(valueSchema, references));
        if (schema.additionalProperties === false) {
          yield Expression.PropertiesExcludePattern(keyPattern, Expression.False());
        }
        if (IsObject(schema.additionalProperties)) {
          yield Expression.PropertiesExcludePattern(keyPattern, Visit(schema.additionalProperties, references));
        }
      },
      { $id: schema.$id },
    );
  }
  function Ref(schema: Types.TRef<any>, references: Types.TSchema[]): Expression {
    return Expression.Ref(schema.$ref);
  }
  function Self(schema: Types.TThis, references: Types.TSchema[]): Expression {
    return Expression.Ref(schema.$ref, { $id: schema.$id });
  }
  function String(schema: Types.TString, references: Types.TSchema[]): Expression {
    return Expression.And(
      function* () {
        yield Expression.IsString();
        if (IsNumber(schema.minLength))
          yield Expression.Property('length', Expression.GreaterThanEqual(schema.minLength));
        if (IsNumber(schema.maxLength)) yield Expression.Property('length', Expression.LessThanEqual(schema.maxLength));
        if (!IsUndefined(schema.pattern)) yield Expression.IsPattern(schema.pattern);
      },
      { $id: schema.$id },
    );
  }
  function TemplateLiteral(schema: Types.TTemplateLiteral, references: Types.TSchema[]): Expression {
    return Expression.IsPattern(schema.pattern);
  }
  function Tuple(schema: Types.TTuple, references: Types.TSchema[]): Expression {
    return Expression.And(
      function* () {
        yield Expression.IsArray();
        if (schema.items === undefined) return yield Expression.Property('length', Expression.Equals(0));
        if (schema.maxItems) yield Expression.Property('length', Expression.Equals(schema.maxItems));
        yield Expression.And(function* () {
          for (let index = 0; index < schema.items!.length; index++) {
            yield Expression.Index(index, Visit(schema.items![index], references));
          }
        });
      },
      { $id: schema.$id },
    );
  }
  function Undefined(schema: Types.TUndefined, references: Types.TSchema[]): Expression {
    return Expression.IsUndefined({ $id: schema.$id });
  }
  function Union(schema: Types.TUnion<any[]>, references: Types.TSchema[]): Expression {
    return Expression.Or(
      function* () {
        for (const inner of schema.anyOf) {
          yield Visit(inner, references);
        }
      },
      { $id: schema.$id },
    );
  }
  function Uint8Array(schema: Types.TUint8Array, references: Types.TSchema[]): Expression {
    return Expression.And(
      function* () {
        yield Expression.InstanceOf('Uint8Array');
        if (IsNumber(schema.maxByteLength))
          yield Expression.Property('length', Expression.LessThanEqual(schema.maxByteLength));
        if (IsNumber(schema.minByteLength))
          yield Expression.Property('length', Expression.GreaterThanEqual(schema.minByteLength));
      },
      { $id: schema.$id },
    );
  }
  function Unknown(schema: Types.TUnknown, references: Types.TSchema[]): Expression {
    return Expression.True({ $id: schema.$id });
  }
  function Void(schema: Types.TVoid, references: Types.TSchema[]): Expression {
    return Expression.IsUndefined({ $id: schema.$id });
  }
  function Unresolved(schema: Types.TSchema, references: Types.TSchema[]): Expression {
    return Expression.False({ unresolved: schema });
  }
  function Visit<T extends Types.TSchema>(schema: T, references: Types.TSchema[]): Expression {
    const anyReferences = schema.$id === undefined ? references : [schema, ...references];
    const anySchema = schema as any;
    switch (anySchema[Types.Kind]) {
      case 'Any':
        return Any(anySchema, anyReferences);
      case 'Array':
        return Array(anySchema, anyReferences);
      case 'Boolean':
        return Boolean(anySchema, anyReferences);
      case 'Constructor':
        return Constructor(anySchema, anyReferences);
      case 'Date':
        return Date(anySchema, anyReferences);
      case 'Function':
        return Function(anySchema, anyReferences);
      case 'Integer':
        return Integer(anySchema, anyReferences);
      case 'Intersect':
        return Intersect(anySchema, anyReferences);
      case 'Literal':
        return Literal(anySchema, anyReferences);
      case 'Never':
        return Never(anySchema, anyReferences);
      case 'Null':
        return Null(anySchema, anyReferences);
      case 'Number':
        return Number(anySchema, anyReferences);
      case 'Object':
        return Object(anySchema, anyReferences);
      case 'Promise':
        return Promise(anySchema, anyReferences);
      case 'Record':
        return Record(anySchema, anyReferences);
      case 'Ref':
        return Ref(anySchema, anyReferences);
      case 'Self':
        return Self(anySchema, anyReferences);
      case 'String':
        return String(anySchema, anyReferences);
      case 'TemplateLiteral':
        return TemplateLiteral(anySchema, anyReferences);
      case 'Tuple':
        return Tuple(anySchema, anyReferences);
      case 'Undefined':
        return Undefined(anySchema, anyReferences);
      case 'Union':
        return Union(anySchema, anyReferences);
      case 'Uint8Array':
        return Uint8Array(anySchema, anyReferences);
      case 'Unknown':
        return Unknown(anySchema, anyReferences);
      case 'Void':
        return Void(anySchema, anyReferences);
      default:
        return Unresolved(schema, anyReferences);
    }
  }
  /** Transforms a Type to an Expression */
  export function Transform(schema: Types.TSchema, references: Types.TSchema[] = []): Expression {
    const expression = Visit(schema, references);
    return expression;
  }
}
export namespace ModelToExpr {
  export function Generate(model: TypeBoxModel): string {
    const definitions: string[] = [];
    for (const type of model.types.filter((type) => Types.TypeGuard.IsSchema(type))) {
      const expression = TypeBoxToExpression.Transform(
        type,
        model.types.filter((t) => t.$id !== type.$id),
      );
      delete expression.$id;
      definitions.push(`
      export const ${type.$id!} = ${JSON.stringify(expression)}
      `);
    }
    const output = [...definitions];
    return Formatter.Format(output.join('\n\n'));
  }
}
