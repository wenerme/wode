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
import { Formatter, PropertyEncoder } from '../common/index';
import { TypeBoxModel } from './model';

// --------------------------------------------------------------------------
// ModelToProtoBuf
// --------------------------------------------------------------------------
export namespace ModelToGRPC {
  function ResolveTypeName(schema: Types.TSchema) {
    if (Types.TypeGuard.IsObject(schema) && schema.$id === undefined) return UnsupportedType(schema);
    if (schema.$id) return schema.$id;
    return Collect(schema);
  }
  function Any(schema: Types.TAny) {
    return UnsupportedType(schema);
  }
  function Array(schema: Types.TArray) {
    return `repeated ${ResolveTypeName(schema.items)}`;
  }
  function BigInt(schema: Types.TBigInt) {
    return UnsupportedType(schema);
  }
  function Boolean(schema: Types.TBoolean) {
    return 'bool';
  }
  function Date(schema: Types.TDate) {
    return UnsupportedType(schema);
  }
  function Constructor(schema: Types.TConstructor): string {
    return UnsupportedType(schema);
  }
  function Function(schema: Types.TFunction) {
    const parameters = schema.parameters.map((schema) => schema.$id);
    const returns = schema.returns.$id;
    return `(${parameters[0]}) returns (${returns}) {}`;
  }
  function Integer(schema: Types.TInteger) {
    return UnsupportedType(schema);
  }
  function Intersect(schema: Types.TIntersect) {
    const all = schema.allOf.every((schema) => Types.TypeGuard.IsObject(schema));
    return all ? Object({ ...Types.Type.Composite(schema.allOf as any), $id: schema.$id }) : '';
  }
  function Literal(schema: Types.TLiteral) {
    return UnsupportedType(schema);
  }
  function Never(schema: Types.TNever) {
    return UnsupportedType(schema);
  }
  function Null(schema: Types.TNull) {
    return UnsupportedType(schema);
  }
  function String(schema: Types.TString) {
    return 'string';
  }
  function Number(schema: Types.TNumber) {
    const id = schema.$id;
    // prettier-ignore
    return (
      id === 'double' ? 'double' : 
      id === 'float' ? 'float' : 
      id === 'int32' ? 'int32' :
      id === 'int64' ? 'int64' :
      id === 'uint32' ? 'uint32' :
      id === 'uint64' ? 'uint64' :
      id === 'sint32' ? 'sint32' :
      id === 'sint64' ? 'sint64' :
      id === 'fixed32' ? 'fixed32' :
      id === 'sfixed32' ? 'sfixed32' :
      id === 'sfixed64' ? 'sfixed64' :
      'double'
    )
  }
  function Object(schema: Types.TObject) {
    const isService = globalThis.Object.values(schema.properties).some((schema) => Types.TypeGuard.IsFunction(schema));
    // prettier-ignore
    const properties = globalThis.Object.entries(schema.properties).map(([key, property], index) => {
      const propertyKey = PropertyEncoder.Encode(key)
      const typeName = ResolveTypeName(property)
      if(property.$id) return `  ${property.$id} ${propertyKey} = ${index}`      
      return (Types.TypeGuard.IsFunction(property))
        ? `  rpc ${propertyKey} ${typeName}`
        : `  ${typeName} ${propertyKey} = ${index}`
    }).join(`\n`)
    if (isService) {
      return `service ${schema.$id!} {\n${properties}\n}`;
    } else {
      return `message ${schema.$id!} {\n${properties}\n}`;
    }
  }
  function Promise(schema: Types.TPromise) {
    return UnsupportedType(schema);
  }
  function Record(schema: Types.TRecord) {
    return UnsupportedType(schema);
  }
  function Ref(schema: Types.TRef) {
    if (!reference_map.has(schema.$ref!)) return UnsupportedType(schema);
    return schema.$ref;
  }
  function This(schema: Types.TThis) {
    return UnsupportedType(schema);
  }
  function Tuple(schema: Types.TTuple) {
    return UnsupportedType(schema);
  }
  function TemplateLiteral(schema: Types.TTemplateLiteral) {
    return UnsupportedType(schema);
  }
  function UInt8Array(schema: Types.TUint8Array): string {
    return 'bytes';
  }
  function Undefined(schema: Types.TUndefined) {
    return UnsupportedType(schema);
  }
  function Union(schema: Types.TUnion) {
    return UnsupportedType(schema);
  }
  function Unknown(schema: Types.TUnknown) {
    return schema.$id!;
  }
  function Void(schema: Types.TVoid) {
    return `void`;
  }
  function UnsupportedType(schema: Types.TSchema) {
    return `unsupported`;
  }
  function Visit(schema: Types.TSchema): string {
    if (schema.$id !== undefined) reference_map.set(schema.$id, schema);
    if (schema.$id !== undefined && emitted_set.has(schema.$id!)) return schema.$id!;
    if (Types.TypeGuard.IsAny(schema)) return Any(schema);
    if (Types.TypeGuard.IsArray(schema)) return Array(schema);
    if (Types.TypeGuard.IsBigInt(schema)) return BigInt(schema);
    if (Types.TypeGuard.IsBoolean(schema)) return Boolean(schema);
    if (Types.TypeGuard.IsDate(schema)) return Date(schema);
    if (Types.TypeGuard.IsConstructor(schema)) return Constructor(schema);
    if (Types.TypeGuard.IsFunction(schema)) return Function(schema);
    if (Types.TypeGuard.IsInteger(schema)) return Integer(schema);
    if (Types.TypeGuard.IsIntersect(schema)) return Intersect(schema);
    if (Types.TypeGuard.IsLiteral(schema)) return Literal(schema);
    if (Types.TypeGuard.IsNever(schema)) return Never(schema);
    if (Types.TypeGuard.IsNull(schema)) return Null(schema);
    if (Types.TypeGuard.IsNumber(schema)) return Number(schema);
    if (Types.TypeGuard.IsObject(schema)) return Object(schema);
    if (Types.TypeGuard.IsPromise(schema)) return Promise(schema);
    if (Types.TypeGuard.IsRecord(schema)) return Record(schema);
    if (Types.TypeGuard.IsRef(schema)) return Ref(schema);
    if (Types.TypeGuard.IsString(schema)) return String(schema);
    if (Types.TypeGuard.IsTemplateLiteral(schema)) return TemplateLiteral(schema);
    if (Types.TypeGuard.IsThis(schema)) return This(schema);
    if (Types.TypeGuard.IsTuple(schema)) return Tuple(schema);
    if (Types.TypeGuard.IsUint8Array(schema)) return UInt8Array(schema);
    if (Types.TypeGuard.IsUndefined(schema)) return Undefined(schema);
    if (Types.TypeGuard.IsUnion(schema)) return Union(schema);
    if (Types.TypeGuard.IsUnknown(schema)) return Unknown(schema);
    if (Types.TypeGuard.IsVoid(schema)) return Void(schema);
    return UnsupportedType(schema);
  }
  function Collect(schema: Types.TSchema) {
    return [...Visit(schema)].join(``);
  }
  function GenerateType(model: TypeBoxModel, schema: Types.TSchema, references: Types.TSchema[]) {
    for (const reference of references) {
      if (reference.$id === undefined) return UnsupportedType(schema);
      reference_map.set(reference.$id, reference);
    }
    return Collect(schema);
  }
  function NativeTypes(model: TypeBoxModel) {
    const exists = model.types.some((schema) => schema.$id === 'double');
    if (exists) return '';
    return [
      '/*',
      'IDL Starter:',
      '',
      'type double   = number',
      'type float    = number',
      'type int32    = number',
      'type int64    = number',
      'type uint32   = number',
      'type uint64   = number',
      'type sint32   = number',
      'type sint64   = number',
      'type fixed32  = number',
      'type fixed64  = number',
      'type sfixed32 = number',
      'type sfixed64 = number',
      'type bool     = boolean',
      'type bytes    = Uint8Array',
      '',
      'type Vector = { x: float, y: float, z: float }',
      '',
      'type Oprand = { a: Vector, b: Vector }',
      '',
      'interface Service {',
      '  add(op: Oprand): Vector',
      '  sub(op: Oprand): Vector',
      '  mul(op: Oprand): Vector',
      '  div(op: Oprand): Vector',
      '}',
      '*/',
    ].join('\n');
  }
  const reference_map = new Map<string, Types.TSchema>();
  const recursive_set = new Set<string>();
  const emitted_set = new Set<string>();
  export function Generate(model: TypeBoxModel): string {
    reference_map.clear();
    recursive_set.clear();
    emitted_set.clear();
    const buffer: string[] = [NativeTypes(model), '', 'const IDL = (`', 'syntax = "proto3";', ''];
    for (const type of model.types) {
      if (!(Types.TypeGuard.IsObject(type) || Types.TypeGuard.IsIntersect(type))) continue;
      buffer.push(GenerateType(model, type, model.types));
    }
    buffer.push('`)');
    return Formatter.Format(buffer.join('\n'));
  }
}
