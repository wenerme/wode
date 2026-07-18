export const DefaultJustBashAdapterMaxReadBytes = 4 * 1024 * 1024;
export const DefaultJustBashAdapterMaxAppendBytes = 4 * 1024 * 1024;
export const MaxJustBashAdapterAllocationBytes = 64 * 1024 * 1024;
export const MaxJustBashAdapterCopyEntries = 100_000;
export const MaxJustBashAdapterCopyDepth = 128;
export const MaxJustBashAdapterDirectoryEntries = 10_000;

export type JustBashCopyLimits = {
	/** Total source nodes, including the copy root. */
	maxEntries: number;
	/** Total source files, including a file copy root. */
	maxFiles: number;
	/** Total source directories, including a directory copy root. */
	maxDirectories: number;
	/** Maximum descendant depth relative to the copy root, whose depth is zero. */
	maxDepth: number;
	/** Maximum immediate children accepted from any source directory. */
	maxDirectoryEntries: number;
	/** Aggregate bytes preloaded from all source files before destination writes begin. */
	maxBytes: number;
};

export const DefaultJustBashAdapterCopyLimits: Readonly<JustBashCopyLimits> = Object.freeze({
	maxEntries: 4_096,
	maxFiles: 3_072,
	maxDirectories: 1_024,
	maxDepth: 32,
	maxDirectoryEntries: 1_024,
	maxBytes: 32 * 1024 * 1024,
});

export type JustBashCopyLimitName = keyof JustBashCopyLimits;

export class JustBashFileAllocationLimitError extends Error {
	constructor(operation: string, maximum: number) {
		super(`${operation} exceeds the ${maximum} byte adapter allocation limit`);
		this.name = 'JustBashFileAllocationLimitError';
	}
}

export class JustBashCopyLimitError extends Error {
	constructor(
		public readonly limit: JustBashCopyLimitName,
		public readonly maximum: number,
	) {
		super(`cp exceeds the ${limit} limit of ${maximum}`);
		this.name = 'JustBashCopyLimitError';
	}
}

export function validateAdapterAllocationLimit(name: string, value: number): number {
	return validatePositiveInteger(name, value, MaxJustBashAdapterAllocationBytes);
}

export function validateAdapterCopyLimits(overrides: Partial<JustBashCopyLimits> = {}): Readonly<JustBashCopyLimits> {
	const limits = { ...DefaultJustBashAdapterCopyLimits, ...overrides };
	validatePositiveInteger('copyLimits.maxEntries', limits.maxEntries, MaxJustBashAdapterCopyEntries);
	validatePositiveInteger('copyLimits.maxFiles', limits.maxFiles, MaxJustBashAdapterCopyEntries);
	validatePositiveInteger('copyLimits.maxDirectories', limits.maxDirectories, MaxJustBashAdapterCopyEntries);
	validateNonNegativeInteger('copyLimits.maxDepth', limits.maxDepth, MaxJustBashAdapterCopyDepth);
	validatePositiveInteger(
		'copyLimits.maxDirectoryEntries',
		limits.maxDirectoryEntries,
		MaxJustBashAdapterDirectoryEntries,
	);
	validatePositiveInteger('copyLimits.maxBytes', limits.maxBytes, MaxJustBashAdapterAllocationBytes);
	return Object.freeze(limits);
}

function validatePositiveInteger(name: string, value: number, maximum: number): number {
	if (!Number.isInteger(value) || value <= 0 || value > maximum) {
		throw new Error(`${name} must be a positive integer no greater than ${maximum}`);
	}
	return value;
}

function validateNonNegativeInteger(name: string, value: number, maximum: number): number {
	if (!Number.isInteger(value) || value < 0 || value > maximum) {
		throw new Error(`${name} must be a non-negative integer no greater than ${maximum}`);
	}
	return value;
}
