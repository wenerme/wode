import {
	AGENT_COMPOSER_DEFAULT_MAX_FILE_SIZE,
	AGENT_COMPOSER_DEFAULT_MAX_FILES,
	AGENT_COMPOSER_DEFAULT_MAX_TOTAL_SIZE,
	type AgentComposerError,
	type AgentComposerLimits,
	type AgentComposerMessages,
	type AgentComposerResolvedLimits,
} from './agent-composer-types';

export type AgentComposerFileValidation = {
	accepted: File[];
	errors: AgentComposerError[];
};

export function resolveAgentComposerLimits(limits: AgentComposerLimits): AgentComposerResolvedLimits {
	return {
		maxFiles: boundedInteger(limits.maxFiles, AGENT_COMPOSER_DEFAULT_MAX_FILES),
		maxFileSize: boundedInteger(limits.maxFileSize, AGENT_COMPOSER_DEFAULT_MAX_FILE_SIZE),
		maxTotalSize: boundedInteger(limits.maxTotalSize, AGENT_COMPOSER_DEFAULT_MAX_TOTAL_SIZE),
	};
}

export function validateAgentComposerControlledFiles(
	files: readonly File[],
	limits: AgentComposerResolvedLimits,
	messages: AgentComposerMessages,
): AgentComposerFileValidation {
	return validateAgentComposerFiles([], files, limits, messages);
}

export function validateAgentComposerFiles(
	current: readonly File[],
	incoming: Iterable<File>,
	limits: AgentComposerResolvedLimits,
	messages: AgentComposerMessages,
): AgentComposerFileValidation {
	const accepted: File[] = [];
	const errors: AgentComposerError[] = [];
	const oversized: File[] = [];
	const overCount: File[] = [];
	const overTotal: File[] = [];
	let totalSize = current.reduce((total, file) => total + finiteSize(file.size), 0);
	let count = current.length;

	for (const file of incoming) {
		const size = safeFileSize(file);
		if (size === undefined || size > limits.maxFileSize) {
			oversized.push(file);
			continue;
		}
		if (count >= limits.maxFiles) {
			overCount.push(file);
			continue;
		}
		if (totalSize + size > limits.maxTotalSize) {
			overTotal.push(file);
			continue;
		}
		accepted.push(file);
		count += 1;
		totalSize += size;
	}

	for (const file of oversized) {
		errors.push({
			code: 'file-size',
			files: [file],
			message: messages.fileSizeError(file.name || messages.unnamedFile, formatAgentComposerBytes(limits.maxFileSize)),
		});
	}
	if (overCount.length > 0) {
		errors.push({ code: 'file-count', files: overCount, message: messages.fileCountError(limits.maxFiles) });
	}
	if (overTotal.length > 0) {
		errors.push({
			code: 'total-size',
			files: overTotal,
			message: messages.totalSizeError(formatAgentComposerBytes(limits.maxTotalSize)),
		});
	}
	return { accepted, errors };
}

export function formatAgentComposerBytes(bytes: number): string {
	const size = finiteSize(bytes);
	if (size >= 1024 * 1024) return `${trimNumber(size / (1024 * 1024))} MiB`;
	if (size >= 1024) return `${trimNumber(size / 1024)} KiB`;
	return `${size} B`;
}

function safeFileSize(file: File): number | undefined {
	try {
		return Number.isFinite(file.size) && file.size >= 0 ? Math.floor(file.size) : undefined;
	} catch {
		return undefined;
	}
}

function finiteSize(value: number): number {
	return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function boundedInteger(value: number | undefined, fallback: number): number {
	return value === undefined || !Number.isFinite(value) ? fallback : Math.max(0, Math.floor(value));
}

function trimNumber(value: number): string {
	return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
}
