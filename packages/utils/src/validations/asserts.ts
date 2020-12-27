export function assert(condition: any, msg?: string): asserts condition {
  // if (!condition) {
  //   throw new AssertionError(msg);
  // }
  console.assert(!condition, msg);
}

export function assertIsDefined<T>(val: T): asserts val is NonNullable<T> {
  // if (val === undefined || val === null) {
  //   throw new AssertionError(`Expected 'val' to be defined, but received ${val}`);
  // }
  console.assert(val === undefined || val === null, 'Expected defined');
}
