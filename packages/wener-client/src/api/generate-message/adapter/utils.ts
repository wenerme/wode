import type { ApiType } from '../../schema/ApiType';
import type { GenerateMessageAdapterContext } from './context';
import type { GenerateMessageErrorKind, GenerateMessageExtensions, GenerateMessageNode } from './types';

export function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Collects native fields not in `known` as extensions for `api`; returns `undefined` when nothing remains. */
export function pickExtensions(
	api: ApiType,
	wire: Record<string, unknown>,
	known: readonly string[],
): GenerateMessageExtensions | undefined {
	let rest: Record<string, unknown> | undefined;
	for (const [key, value] of Object.entries(wire)) {
		if (known.includes(key)) continue;
		rest ??= {};
		rest[key] = value;
	}
	return rest ? { [api]: rest } : undefined;
}

/**
 * Writes the node's extensions for `api` onto `wire` without overriding mapped fields,
 * and reports extensions of other protocols as dropped.
 */
export function applyExtensions<T extends Record<string, unknown>>(
	api: ApiType,
	node: GenerateMessageNode | undefined,
	wire: T,
	ctx: GenerateMessageAdapterContext,
	path: string,
): T {
	const extensions = node?.extensions;
	if (!extensions) return wire;
	for (const [owner, fields] of Object.entries(extensions)) {
		if (!fields) continue;
		if (owner === api) {
			for (const [key, value] of Object.entries(fields)) {
				if (!(key in wire)) (wire as Record<string, unknown>)[key] = value;
			}
			continue;
		}
		for (const key of Object.keys(fields)) {
			ctx.report({
				code: 'drop',
				path: path ? `${path}.${key}` : key,
				message: `${owner} field has no ${api} mapping`,
				api: owner as ApiType,
			});
		}
	}
	return wire;
}

export function getHint<T = unknown>(node: GenerateMessageNode | undefined, api: ApiType, key: string): T | undefined {
	return node?.hints?.[api]?.[key] as T | undefined;
}

export function withHint<T extends GenerateMessageNode>(node: T, api: ApiType, key: string, value: unknown): T {
	if (value === undefined) return node;
	node.hints = { ...node.hints, [api]: { ...node.hints?.[api], [key]: value } };
	return node;
}

export function mergeExtensions(node: GenerateMessageNode, extensions: GenerateMessageExtensions | undefined): void {
	if (!extensions) return;
	for (const [api, fields] of Object.entries(extensions) as [ApiType, Record<string, unknown>][]) {
		node.extensions = { ...node.extensions, [api]: { ...node.extensions?.[api], ...fields } };
	}
}

export function parseJsonObject(text: string): Record<string, unknown> | undefined {
	if (!text.trim()) return {};
	try {
		const value: unknown = JSON.parse(text);
		return isRecord(value) ? value : undefined;
	} catch {
		return undefined;
	}
}

export function errorKindFromStatus(status: number | undefined): GenerateMessageErrorKind {
	switch (status) {
		case 400:
		case 422:
			return 'invalid-request';
		case 401:
			return 'authentication';
		case 403:
			return 'permission';
		case 404:
			return 'not-found';
		case 408:
		case 504:
			return 'timeout';
		case 413:
			return 'context-length';
		case 429:
			return 'rate-limit';
		case 503:
		case 529:
			return 'overloaded';
		default:
			return status !== undefined && status >= 500 ? 'server' : 'other';
	}
}

export function statusFromErrorKind(kind: GenerateMessageErrorKind): number {
	switch (kind) {
		case 'invalid-request':
		case 'context-length':
		case 'content-filter':
			return 400;
		case 'authentication':
			return 401;
		case 'permission':
			return 403;
		case 'not-found':
			return 404;
		case 'rate-limit':
			return 429;
		case 'overloaded':
			return 503;
		case 'timeout':
			return 504;
		default:
			return 500;
	}
}
