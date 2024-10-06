export {
  /**
   * @deprecated
   */
  GraphQLJSONObject as GraphQLJSONObjectScalar,
  /**
   * @deprecated
   */
  GraphQLJSON as GraphQLJSONScalar,
} from 'graphql-scalars';

// https://github.com/taion/graphql-type-json/blob/master/src/index.js

// export const GraphQLJSONObjectScalar = new GraphQLScalarType({
//   name: 'JSONObject',
//   description:
//     'The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).',
//   serialize: ensureObject,
//   parseValue: ensureObject,
//   parseLiteral: (ast, variables) => {
//     if (ast.kind !== Kind.OBJECT) {
//       throw new TypeError(`JSONObject cannot represent non-object value: ${print(ast)}`);
//     }
//
//     return parseObject('JSONObject', ast, variables);
//   },
// });

// export const GraphQLJSONScalar = new GraphQLScalarType({
//   name: 'JSON',
//   description:
//     'The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).',
//   serialize: identity,
//   parseValue: identity,
//   parseLiteral: (ast, variables) => parseLiteral('JSON', ast, variables),
// });
//
// function identity<T>(value: T): T {
//   return value;
// }
//
// function parseObject(typeName: string, ast: ObjectValueNode, variables: any) {
//   const value = Object.create(null);
//   ast.fields.forEach((field) => {
//     // eslint-disable-next-line no-use-before-define
//     value[field.name.value] = parseLiteral(typeName, field.value, variables);
//   });
//
//   return value;
// }
//
// function parseLiteral(typeName: string, ast: ValueNode, variables: any): any {
//   switch (ast.kind) {
//     case Kind.STRING:
//     case Kind.BOOLEAN:
//       return ast.value;
//     case Kind.INT:
//     case Kind.FLOAT:
//       return parseFloat(ast.value);
//     case Kind.OBJECT:
//       return parseObject(typeName, ast, variables);
//     case Kind.LIST:
//       return ast.values.map((n) => parseLiteral(typeName, n, variables));
//     case Kind.NULL:
//       return null;
//     case Kind.VARIABLE:
//       return variables ? variables[ast.name.value] : undefined;
//     default:
//       throw new TypeError(`${typeName} cannot represent value: ${print(ast)}`);
//   }
// }
//
// function ensureObject(value: any) {
//   if (typeof value !== 'object' || value === null || Array.isArray(value)) {
//     throw new TypeError(`JSONObject cannot represent non-object value: ${value}`);
//   }
//
//   return value;
// }
