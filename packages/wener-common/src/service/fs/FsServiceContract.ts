import { oc, type ContractRouterClient, type InferContractRouterInputs, type InferContractRouterOutputs } from '@orpc/contract';
import { z } from 'zod';
import type { ServiceToolMeta } from '../runtime/contract';

const fs = oc.$meta<ServiceToolMeta>({});
const readTool: ServiceToolMeta = { readOnlyHint: true, destructiveHint: false };
const writeTool: ServiceToolMeta = { readOnlyHint: false, destructiveHint: false };
const destructiveTool: ServiceToolMeta = { readOnlyHint: false, destructiveHint: true };

export const FsWriteOperations = new Set(['write', 'mkdir', 'rm', 'mv', 'cp']);

/** Default and hard caps for content crossing the JSON tool boundary. */
export const FS_DEFAULT_READ_BYTES = 1024 * 1024;
export const FS_MAX_CONTENT_BYTES = 16 * 1024 * 1024;
export const FS_DEFAULT_LIST_ENTRIES = 1000;
export const FS_MAX_LIST_ENTRIES = 10_000;
/** Base64 length of FS_MAX_CONTENT_BYTES; UTF-8 text is bounded again in bytes by the service. */
export const FS_MAX_CONTENT_CHARS = Math.ceil(FS_MAX_CONTENT_BYTES / 3) * 4;

const PathSchema = z.string().min(1).max(4096).refine(
	// Backslashes are rejected so no backend can reinterpret them as separators.
	(value) => !/[\u0000-\u001f\u007f\\]/u.test(value) && !value.split('/').includes('..'),
	'Path must not contain control characters, backslashes or .. segments',
);
const EncodingSchema = z.enum(['utf8', 'base64']);

export const FsEntrySchema = z.strictObject({
	path: z.string(),
	name: z.string(),
	kind: z.enum(['file', 'directory']),
	size: z.number().int().nonnegative(),
	/** Last modification time as an ISO 8601 string; omitted when the backend does not report it. */
	mtime: z.iso.datetime().optional(),
	etag: z.string().optional(),
	contentType: z.string().optional(),
});

export const FsListInputSchema = z.strictObject({
	path: PathSchema.default('/'),
	recursive: z.boolean().optional(),
	depth: z.number().int().positive().max(64).optional(),
	glob: z.string().min(1).optional(),
	kind: z.enum(['file', 'directory']).optional(),
	hidden: z.boolean().optional(),
	maxEntries: z.number().int().positive().max(FS_MAX_LIST_ENTRIES).default(FS_DEFAULT_LIST_ENTRIES),
}).default({ path: '/', maxEntries: FS_DEFAULT_LIST_ENTRIES });
export const FsListOutputSchema = z.array(FsEntrySchema);

export const FsPathInputSchema = z.strictObject({ path: PathSchema });
export const FsPathOutputSchema = z.strictObject({ path: z.string() });
export const FsStatOutputSchema = FsEntrySchema.nullable();

export const FsReadInputSchema = z.strictObject({
	path: PathSchema,
	/** `utf8` decodes text; use `base64` for binary content. */
	encoding: EncodingSchema.default('utf8'),
	maxBytes: z.number().int().positive().max(FS_MAX_CONTENT_BYTES).default(FS_DEFAULT_READ_BYTES),
});
export const FsReadOutputSchema = z.strictObject({
	path: z.string(),
	encoding: EncodingSchema,
	content: z.string(),
	/** Bytes returned in `content`. */
	size: z.number().int().nonnegative(),
	/** True when the file is larger than `maxBytes` and content was cut. */
	truncated: z.boolean(),
});

export const FsWriteInputSchema = z.strictObject({
	path: PathSchema,
	content: z.string().max(FS_MAX_CONTENT_CHARS),
	encoding: EncodingSchema.default('utf8'),
	/** Default false: refuses to replace an existing file. */
	overwrite: z.boolean().default(false),
});
export const FsWriteOutputSchema = z.strictObject({ path: z.string(), size: z.number().int().nonnegative() });

export const FsMkdirInputSchema = z.strictObject({ path: PathSchema, recursive: z.boolean().default(false) });
export const FsRmInputSchema = z.strictObject({
	path: PathSchema,
	recursive: z.boolean().default(false),
	force: z.boolean().default(false),
});

export const FsTransferInputSchema = z.strictObject({
	from: PathSchema,
	to: PathSchema,
	overwrite: z.boolean().default(false),
});
export const FsTransferOutputSchema = z.strictObject({ from: z.string(), to: z.string() });

export const FsServiceContract = {
	list: fs.input(FsListInputSchema).output(FsListOutputSchema).meta({
		...readTool, description: 'List a directory, optionally recursively, bounded by maxEntries.',
	}),
	stat: fs.input(FsPathInputSchema).output(FsStatOutputSchema).meta({
		...readTool, description: 'Get metadata for a path; null when it does not exist.',
	}),
	read: fs.input(FsReadInputSchema).output(FsReadOutputSchema).meta({
		...readTool, description: 'Read a file as UTF-8 text or Base64, bounded by maxBytes.',
	}),
	// overwrite can replace existing data, so write and cp are marked destructive.
	write: fs.input(FsWriteInputSchema).output(FsWriteOutputSchema).meta({
		...destructiveTool, description: 'Write a file from UTF-8 text or Base64 content.',
	}),
	mkdir: fs.input(FsMkdirInputSchema).output(FsPathOutputSchema).meta({
		...writeTool, description: 'Create a directory.',
	}),
	rm: fs.input(FsRmInputSchema).output(FsPathOutputSchema).meta({
		...destructiveTool, description: 'Remove a file or directory.',
	}),
	mv: fs.input(FsTransferInputSchema).output(FsTransferOutputSchema).meta({
		...destructiveTool, description: 'Move or rename a file or directory.',
	}),
	cp: fs.input(FsTransferInputSchema).output(FsTransferOutputSchema).meta({
		...destructiveTool, description: 'Copy a file or directory.',
	}),
};

export type FsServiceInputs = InferContractRouterInputs<typeof FsServiceContract>;
export type FsServiceOutputs = InferContractRouterOutputs<typeof FsServiceContract>;
export interface FsServiceClientContext { timeoutMs?: number }
export type IFsServiceContract = ContractRouterClient<typeof FsServiceContract, FsServiceClientContext>;
export type FsServiceCallOptions = NonNullable<Parameters<IFsServiceContract['read']>[1]>;
