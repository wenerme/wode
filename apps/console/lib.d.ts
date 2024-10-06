/*
https://github.com/total-typescript/ts-reset/blob/main/src/entrypoints/filter-boolean.d.ts

https://github.com/microsoft/TypeScript/issues/16655
 */

interface Array<T> {
  filter(predicate: BooleanConstructor, thisArg?: any): NonFalsy<T>[];
}

interface ReadonlyArray<T> {
  filter(predicate: BooleanConstructor, thisArg?: any): NonFalsy<T>[];
}

type NonFalsy<T> = T extends false | 0 | '' | null | undefined | 0n ? never : T;

interface ArrayBuffer {
  resize(byteLength: number): ArrayBuffer;

  readonly resizable: boolean;
}

interface SharedArrayBuffer {
  resize(byteLength: number): ArrayBuffer;

  readonly resizable: boolean;
}
