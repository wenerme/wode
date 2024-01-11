import { TSchema } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

// works like zod parse
export const Parse = <T extends TSchema>(T: T, value: unknown) =>
  // run transform, get T
  Value.Decode(
    T,
    // remove additional
    Value.Clean(
      T,
      // add missing
      Value.Default(
        T,
        // '1' -> 1
        Value.Convert(T, value),
      ),
    ),
  );

export const SafeParse = <T extends TSchema>(T: T, value: unknown) => {
  let out = Value.Clean(T, Value.Default(T, Value.Convert(T, value)));
  if (Value.Check(T, out)) {
    // decode 也会 check
    return {
      data: Value.Decode(T, out),
      success: true,
    };
  }
  return {
    errors: Array.from(Value.Errors(T, [], value)),
    success: false,
  };
};
