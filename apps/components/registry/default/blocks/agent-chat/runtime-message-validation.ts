import type { UIMessage } from 'ai';

export type AgentRuntimeMessageLimits = {
	maxArrayItems?: number;
	maxDataUrlBytes?: number;
	maxDepth?: number;
	maxMessages?: number;
	maxNodes?: number;
	maxObjectKeys?: number;
	maxParts?: number;
	maxStringBytes?: number;
};

export type AgentRuntimeMessageValidation =
	| { success: true; messages: readonly UIMessage[] }
	| { success: false; code: AgentRuntimeMessageErrorCode; message: string };
export type AgentRuntimeMessageErrorCode =
	| 'data-url-bytes'
	| 'depth'
	| 'invalid'
	| 'messages'
	| 'nodes'
	| 'parts'
	| 'string-bytes';

type ResolvedLimits = Required<AgentRuntimeMessageLimits>;
type InspectionState = {
	active: WeakSet<object>;
	dataUrlBytes: number;
	limits: ResolvedLimits;
	nodes: number;
	parts: number;
	stringBytes: number;
};

export const AGENT_RUNTIME_DEFAULT_MESSAGE_LIMITS: ResolvedLimits = {
	maxArrayItems: 512,
	maxDataUrlBytes: 32 * 1024 * 1024,
	maxDepth: 32,
	maxMessages: 100,
	maxNodes: 10_000,
	maxObjectKeys: 64,
	maxParts: 2_000,
	maxStringBytes: 2 * 1024 * 1024,
};

export function validateAgentRuntimeMessages(
	value: unknown,
	limits: AgentRuntimeMessageLimits = {},
): AgentRuntimeMessageValidation {
	const resolved = resolveLimits(limits);
	if (!Array.isArray(value)) return invalid('消息记录必须是数组。');
	const messageCount = safeArrayLength(value);
	if (messageCount === undefined) return invalid('消息记录无法安全读取。');
	if (messageCount > resolved.maxMessages) {
		return failure('messages', `消息数量不能超过 ${resolved.maxMessages} 条。`);
	}
	let parts = 0;
	for (let index = 0; index < messageCount; index += 1) {
		const message = readDataProperty(value, String(index));
		if (!isRecord(message)) return invalid(`第 ${index + 1} 条消息无效。`);
		const id = readDataProperty(message, 'id');
		const role = readDataProperty(message, 'role');
		const messageParts = readDataProperty(message, 'parts');
		if (typeof id !== 'string' || !id || (role !== 'assistant' && role !== 'system' && role !== 'user')) {
			return invalid(`第 ${index + 1} 条消息身份无效。`);
		}
		if (!Array.isArray(messageParts)) return invalid(`第 ${index + 1} 条消息内容必须是数组。`);
		const partCount = safeArrayLength(messageParts);
		if (partCount === undefined) return invalid(`第 ${index + 1} 条消息内容无法安全读取。`);
		parts += partCount;
		if (parts > resolved.maxParts) return failure('parts', `消息内容不能超过 ${resolved.maxParts} 个部分。`);
	}
	const state: InspectionState = {
		active: new WeakSet(),
		dataUrlBytes: 0,
		limits: resolved,
		nodes: 0,
		parts,
		stringBytes: 0,
	};
	const issue = inspectRuntimeValue(value, 0, state);
	return issue ?? { success: true, messages: value as readonly UIMessage[] };
}

export type AgentRuntimeValueMeasurement =
	| { success: true; dataUrlBytes: number; nodes: number; stringBytes: number }
	| Exclude<AgentRuntimeMessageValidation, { success: true }>;

export function measureAgentRuntimeValue(
	value: unknown,
	limits: AgentRuntimeMessageLimits = {},
): AgentRuntimeValueMeasurement {
	const resolved = resolveLimits(limits);
	const state: InspectionState = {
		active: new WeakSet(),
		dataUrlBytes: 0,
		limits: resolved,
		nodes: 0,
		parts: 0,
		stringBytes: 0,
	};
	const issue = inspectRuntimeValue(value, 0, state);
	return (
		issue ?? {
			success: true,
			dataUrlBytes: state.dataUrlBytes,
			nodes: state.nodes,
			stringBytes: state.stringBytes,
		}
	);
}

export function validateAgentRuntimeValue(
	value: unknown,
	limits: AgentRuntimeMessageLimits = {},
): Exclude<AgentRuntimeMessageValidation, { success: true }> | undefined {
	const result = measureAgentRuntimeValue(value, limits);
	return result.success ? undefined : result;
}

function inspectRuntimeValue(
	value: unknown,
	depth: number,
	state: InspectionState,
): Exclude<AgentRuntimeMessageValidation, { success: true }> | undefined {
	state.nodes += 1;
	if (state.nodes > state.limits.maxNodes) return failure('nodes', '消息结构过于复杂。');
	if (depth > state.limits.maxDepth) return failure('depth', '消息嵌套层级过深。');
	if (typeof value === 'string') return addStringBytes(value, state);
	if (value === undefined || value === null || typeof value === 'boolean' || typeof value === 'number')
		return undefined;
	if (typeof value !== 'object') return invalid('消息包含不受支持的运行时值。');
	if (state.active.has(value)) return invalid('消息不能包含循环引用。');
	state.active.add(value);
	try {
		if (Array.isArray(value)) {
			const length = safeArrayLength(value);
			if (length === undefined) return invalid('消息数组无法安全读取。');
			if (length > state.limits.maxArrayItems) return failure('nodes', '消息数组条目过多。');
			for (let index = 0; index < length; index += 1) {
				const descriptor = safeOwnDescriptor(value, String(index));
				if (!descriptor || !('value' in descriptor)) return invalid('消息数组包含不可读取的条目。');
				const issue = inspectRuntimeValue(descriptor.value, depth + 1, state);
				if (issue) return issue;
			}
			return undefined;
		}
		let inspected = 0;
		try {
			for (const key in value) {
				inspected += 1;
				if (inspected > state.limits.maxObjectKeys) return failure('nodes', '消息对象字段过多。');
				let own: boolean;
				try {
					own = Object.hasOwn(value, key);
				} catch {
					return invalid('消息对象无法安全读取。');
				}
				if (!own) continue;
				const keyIssue = addStringBytes(key, state);
				if (keyIssue) return keyIssue;
				const descriptor = safeOwnDescriptor(value, key);
				if (!descriptor || !('value' in descriptor)) return invalid('消息不能包含 getter 或不可读取字段。');
				const issue = inspectRuntimeValue(descriptor.value, depth + 1, state);
				if (issue) return issue;
			}
		} catch {
			return invalid('消息对象无法安全读取。');
		}
		return undefined;
	} finally {
		state.active.delete(value);
	}
}

function addStringBytes(
	value: string,
	state: InspectionState,
): Exclude<AgentRuntimeMessageValidation, { success: true }> | undefined {
	const dataUrl = value.startsWith('data:');
	const current = dataUrl ? state.dataUrlBytes : state.stringBytes;
	const maximum = dataUrl ? state.limits.maxDataUrlBytes : state.limits.maxStringBytes;
	const bytes = boundedUtf8ByteLength(value, maximum - current);
	if (bytes === undefined) {
		return dataUrl
			? failure('data-url-bytes', '消息中的 Data URL 总大小超过限制。')
			: failure('string-bytes', '消息文本总大小超过限制。');
	}
	if (dataUrl) state.dataUrlBytes += bytes;
	else state.stringBytes += bytes;
	return undefined;
}

function boundedUtf8ByteLength(value: string, remaining: number): number | undefined {
	if (remaining < 0 || value.length > remaining) return undefined;
	let bytes = 0;
	for (let index = 0; index < value.length; index += 1) {
		const code = value.charCodeAt(index);
		if (code < 0x80) bytes += 1;
		else if (code < 0x800) bytes += 2;
		else if (code >= 0xd800 && code <= 0xdbff && index + 1 < value.length) {
			const next = value.charCodeAt(index + 1);
			if (next >= 0xdc00 && next <= 0xdfff) {
				bytes += 4;
				index += 1;
			} else bytes += 3;
		} else bytes += 3;
		if (bytes > remaining) return undefined;
	}
	return bytes;
}

function readDataProperty(value: object, key: PropertyKey): unknown {
	const descriptor = safeOwnDescriptor(value, key);
	return descriptor && 'value' in descriptor ? descriptor.value : undefined;
}

function safeArrayLength(value: unknown[]): number | undefined {
	const descriptor = safeOwnDescriptor(value, 'length');
	return descriptor && 'value' in descriptor && typeof descriptor.value === 'number'
		? Math.max(0, Math.floor(descriptor.value))
		: undefined;
}

function safeOwnDescriptor(value: object, key: PropertyKey): PropertyDescriptor | undefined {
	try {
		return Object.getOwnPropertyDescriptor(value, key);
	} catch {
		return undefined;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function resolveLimits(limits: AgentRuntimeMessageLimits): ResolvedLimits {
	return {
		maxArrayItems: resolveLimit(limits.maxArrayItems, AGENT_RUNTIME_DEFAULT_MESSAGE_LIMITS.maxArrayItems),
		maxDataUrlBytes: resolveLimit(limits.maxDataUrlBytes, AGENT_RUNTIME_DEFAULT_MESSAGE_LIMITS.maxDataUrlBytes),
		maxDepth: resolveLimit(limits.maxDepth, AGENT_RUNTIME_DEFAULT_MESSAGE_LIMITS.maxDepth),
		maxMessages: resolveLimit(limits.maxMessages, AGENT_RUNTIME_DEFAULT_MESSAGE_LIMITS.maxMessages),
		maxNodes: resolveLimit(limits.maxNodes, AGENT_RUNTIME_DEFAULT_MESSAGE_LIMITS.maxNodes),
		maxObjectKeys: resolveLimit(limits.maxObjectKeys, AGENT_RUNTIME_DEFAULT_MESSAGE_LIMITS.maxObjectKeys),
		maxParts: resolveLimit(limits.maxParts, AGENT_RUNTIME_DEFAULT_MESSAGE_LIMITS.maxParts),
		maxStringBytes: resolveLimit(limits.maxStringBytes, AGENT_RUNTIME_DEFAULT_MESSAGE_LIMITS.maxStringBytes),
	};
}

function resolveLimit(value: number | undefined, fallback: number): number {
	return value === undefined || !Number.isFinite(value) ? fallback : Math.max(0, Math.floor(value));
}

function invalid(message: string): Exclude<AgentRuntimeMessageValidation, { success: true }> {
	return failure('invalid', message);
}

function failure(
	code: AgentRuntimeMessageErrorCode,
	message: string,
): Exclude<AgentRuntimeMessageValidation, { success: true }> {
	return { success: false, code, message };
}
