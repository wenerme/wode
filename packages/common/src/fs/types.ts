import { z } from 'zod/v4';

type EnumValues<T> = T[Exclude<keyof T, '__proto__'>];
export const FileKind = Object.freeze({
  __proto__: null,
  firectory: 'directory',
  file: 'file',
});
export type FileKind = EnumValues<typeof FileKind>;
export const FileKindSchema = z.enum(['directory', 'file']);
