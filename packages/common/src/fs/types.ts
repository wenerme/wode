import { z } from 'zod/v4';

type EnumValues<T> = T[Exclude<keyof T, '__proto__'>];
export const FileKind = Object.freeze({
	__proto__: null,
	firectory: 'directory',
	file: 'file',
});
export type FileKind = EnumValues<typeof FileKind>;
export const FileKindSchema = z.enum(['directory', 'file']);

export type ReaddirOptions = z.infer<typeof ReaddirOptionsSchema>;
export const ReaddirOptionsSchema = z.object({
	recursive: z.boolean().optional(),
	depth: z.number().optional(),
	glob: z.string().optional(),
	kind: FileKindSchema.optional(),
	cursor: z.string().optional(),
	hidden: z.boolean().default(false),
});

export type FileUrlOptions = z.infer<typeof FileUrlOptionsSchema>;
export const FileUrlOptionsSchema = z.object({
	size: z.coerce.number().optional(),
	width: z.number().optional(),
	height: z.number().optional(),
	quality: z.number().optional(),
	thumbnail: z.boolean().optional(),
});
