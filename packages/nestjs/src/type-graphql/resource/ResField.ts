import { Field, FieldOptions } from 'type-graphql';

export type MethodAndPropDecorator = PropertyDecorator & MethodDecorator;

export function ResField(
  returnTypeFunction?: any,
  options?: FieldOptions & {
    hidden?: boolean;
    visible?: boolean;
  },
): MethodAndPropDecorator {
  let visible = options?.visible ?? !options?.hidden;
  if (!visible) {
    return () => {};
  }
  return Field(returnTypeFunction, options);
}
