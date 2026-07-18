export type AgentMessageValueRecord = Record<string, unknown>;

export type AgentMessageValueProjectionLimits = {
	maxArrayItems?: number;
	maxDepth?: number;
	maxNodes?: number;
	maxObjectKeys?: number;
	maxStringLength?: number;
};

type ResolvedProjectionLimits = Required<AgentMessageValueProjectionLimits>;
type ProjectionState = {
	ancestors: WeakSet<object>;
	limits: ResolvedProjectionLimits;
	nodes: number;
};

const DEFAULT_PROJECTION_LIMITS: ResolvedProjectionLimits = {
	maxArrayItems: 32,
	maxDepth: 6,
	maxNodes: 256,
	maxObjectKeys: 32,
	maxStringLength: 1_024,
};
const TRUNCATED = '[已截断]';
const UNREADABLE = '[无法读取]';

export function isAgentMessageRecord(value: unknown): value is AgentMessageValueRecord {
	return typeof value === 'object' && value !== null;
}

export function readAgentMessageValue(value: unknown, key: string): unknown {
	if (!isAgentMessageRecord(value)) return undefined;
	try {
		return value[key];
	} catch {
		return undefined;
	}
}

export function readAgentMessageString(value: unknown, key: string): string | undefined {
	const field = readAgentMessageValue(value, key);
	return typeof field === 'string' ? field : undefined;
}

export function projectAgentMessageValue(value: unknown, limits: AgentMessageValueProjectionLimits = {}): unknown {
	const resolved = resolveProjectionLimits(limits);
	return projectValue(value, 0, { ancestors: new WeakSet(), limits: resolved, nodes: 0 });
}

export function formatAgentMessageValue(value: unknown, maxLength = 4_096): string {
	const outputLimit = boundedLimit(maxLength, 4_096);
	const projection = projectAgentMessageValue(value, {
		maxStringLength: Math.min(DEFAULT_PROJECTION_LIMITS.maxStringLength, Math.max(0, outputLimit)),
	});
	try {
		const formatted = typeof projection === 'string' ? projection : JSON.stringify(projection, null, 2);
		return truncate(formatted ?? UNREADABLE, outputLimit);
	} catch {
		return '[无法格式化]';
	}
}

export function resolveAgentMessageHref(value: unknown, kind: 'file' | 'source'): string | undefined {
	const maxLength = kind === 'file' ? 32 * 1024 * 1024 : 8 * 1024;
	if (typeof value !== 'string' || value.length > maxLength) return undefined;
	try {
		const url = new URL(value);
		if (url.protocol === 'https:' || url.protocol === 'http:') return value;
		if (kind === 'file' && (url.protocol === 'blob:' || url.protocol === 'data:')) return value;
	} catch {
		return undefined;
	}
	return undefined;
}

function projectValue(value: unknown, depth: number, state: ProjectionState): unknown {
	if (state.nodes >= state.limits.maxNodes) return TRUNCATED;
	state.nodes += 1;
	if (typeof value === 'string') return truncate(value, state.limits.maxStringLength);
	if (value === undefined) return '[undefined]';
	if (value === null || typeof value === 'number' || typeof value === 'boolean') return value;
	if (typeof value === 'bigint') return `${value.toString()}n`;
	if (typeof value === 'symbol') return `[Symbol${value.description ? `: ${truncate(value.description, 64)}` : ''}]`;
	if (typeof value === 'function') return '[Function]';
	if (typeof value !== 'object') return UNREADABLE;
	if (depth >= state.limits.maxDepth) return TRUNCATED;
	if (state.ancestors.has(value)) return '[Circular]';
	state.ancestors.add(value);
	try {
		return Array.isArray(value) ? projectArray(value, depth, state) : projectObject(value, depth, state);
	} catch {
		return UNREADABLE;
	} finally {
		state.ancestors.delete(value);
	}
}

function projectArray(value: unknown[], depth: number, state: ProjectionState): unknown[] {
	const lengthDescriptor = safeOwnDescriptor(value, 'length');
	if (!lengthDescriptor || !('value' in lengthDescriptor) || typeof lengthDescriptor.value !== 'number') {
		return [UNREADABLE];
	}
	const length = Math.max(0, Math.floor(lengthDescriptor.value));
	const count = Math.min(length, state.limits.maxArrayItems);
	const output: unknown[] = [];
	for (let index = 0; index < count && state.nodes < state.limits.maxNodes; index += 1) {
		const descriptor = safeOwnDescriptor(value, String(index));
		output.push(projectDescriptor(descriptor, depth + 1, state));
	}
	if (length > count) output.push(`${TRUNCATED} ${length - count} 项`);
	return output;
}

function projectObject(value: object, depth: number, state: ProjectionState): AgentMessageValueRecord {
	const output = Object.create(null) as AgentMessageValueRecord;
	let inspected = 0;
	let projected = 0;
	let truncated = false;
	try {
		for (const key in value) {
			inspected += 1;
			if (inspected > state.limits.maxObjectKeys || state.nodes >= state.limits.maxNodes) {
				truncated = true;
				break;
			}
			let own = false;
			try {
				own = Object.hasOwn(value, key);
			} catch {
				defineProjection(output, truncate(key, 256), UNREADABLE);
				projected += 1;
				continue;
			}
			if (!own) continue;
			const safeKey = truncate(key, 256);
			defineProjection(output, safeKey, projectDescriptor(safeOwnDescriptor(value, key), depth + 1, state));
			projected += 1;
		}
	} catch {
		defineProjection(output, '[读取错误]', UNREADABLE);
	}
	if (truncated || projected >= state.limits.maxObjectKeys) defineProjection(output, '[更多字段]', TRUNCATED);
	return output;
}

function projectDescriptor(descriptor: PropertyDescriptor | undefined, depth: number, state: ProjectionState): unknown {
	if (!descriptor) return '[缺失]';
	if (!('value' in descriptor)) return '[Accessor]';
	return projectValue(descriptor.value, depth, state);
}

function safeOwnDescriptor(value: object, key: PropertyKey): PropertyDescriptor | undefined {
	try {
		return Object.getOwnPropertyDescriptor(value, key);
	} catch {
		return undefined;
	}
}

function defineProjection(target: AgentMessageValueRecord, key: string, value: unknown) {
	Object.defineProperty(target, key, { configurable: true, enumerable: true, value, writable: true });
}

function resolveProjectionLimits(limits: AgentMessageValueProjectionLimits): ResolvedProjectionLimits {
	return {
		maxArrayItems: boundedLimit(limits.maxArrayItems, DEFAULT_PROJECTION_LIMITS.maxArrayItems),
		maxDepth: boundedLimit(limits.maxDepth, DEFAULT_PROJECTION_LIMITS.maxDepth),
		maxNodes: boundedLimit(limits.maxNodes, DEFAULT_PROJECTION_LIMITS.maxNodes),
		maxObjectKeys: boundedLimit(limits.maxObjectKeys, DEFAULT_PROJECTION_LIMITS.maxObjectKeys),
		maxStringLength: boundedLimit(limits.maxStringLength, DEFAULT_PROJECTION_LIMITS.maxStringLength),
	};
}

function boundedLimit(value: number | undefined, fallback: number): number {
	return value === undefined || !Number.isFinite(value) ? fallback : Math.max(0, Math.floor(value));
}

function truncate(value: string, maxLength: number): string {
	const limit = boundedLimit(maxLength, 4_096);
	return value.length <= limit ? value : `${value.slice(0, Math.max(0, limit - 1))}…`;
}
