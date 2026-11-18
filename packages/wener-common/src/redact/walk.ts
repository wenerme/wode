import { hasRedactableValue, type RedactionContext, type RedactionPolicy } from './policy';
import { redactMessageValue, redactTextValue } from './text';

class RedactionLimit extends Error {}

export function runRedaction(value: unknown, policy: RedactionPolicy, key?: string, message = false) {
	let nodes = 0;
	const context: RedactionContext = {
		policy,
		hits: 0,
		mark() {
			this.hits += 1;
		},
		spend() {
			if (++nodes > policy.maxNodes) throw new RedactionLimit();
		},
	};
	const seen = new WeakMap<object, unknown>();
	function mask() {
		context.mark();
		return policy.marker;
	}
	function walk(input: unknown, key: string | undefined, depth: number, diagnostic = false): unknown {
		context.spend();
		if (!hasRedactableValue(input)) return input;
		if (policy.shouldMask(input, key)) return mask();
		if (typeof input === 'object' && input !== null && seen.has(input)) return seen.get(input);
		if (depth > policy.maxDepth) return mask();
		if (typeof input === 'string')
			return diagnostic
				? redactMessageValue(input, context, (value, key) => walk(value, key, depth + 1, true))
				: redactTextValue(input, context, (value, key) => walk(value, key, depth + 1));
		if (input === null || typeof input !== 'object') return input;
		if (input instanceof Date || input instanceof RegExp || input instanceof ArrayBuffer || ArrayBuffer.isView(input))
			return input;

		if (typeof URL !== 'undefined' && input instanceof URL) {
			const result = new URL(URL.prototype.toString.call(input));
			seen.set(input, result);
			if (result.username || result.password) {
				result.username = policy.marker;
				result.password = '';
				context.mark();
			}
			const hits = context.hits;
			const params = walk(result.searchParams, undefined, depth + 1);
			if (!(params instanceof URLSearchParams)) return mask();
			if (context.hits !== hits) result.search = params.toString();
			result.pathname = String(walk(result.pathname, undefined, depth + 1, true));
			result.hash = String(walk(result.hash, undefined, depth + 1, true));
			return result;
		}
		if (typeof URLSearchParams !== 'undefined' && input instanceof URLSearchParams) {
			const result = new URLSearchParams();
			seen.set(input, result);
			for (const [name, item] of URLSearchParams.prototype.entries.call(input)) {
				result.append(name, String(walk(item, name, depth + 1)));
			}
			return result;
		}
		if (typeof Headers !== 'undefined' && input instanceof Headers) {
			const result = new Headers();
			seen.set(input, result);
			for (const [name, item] of Headers.prototype.entries.call(input)) {
				const redacted = String(walk(item, name, depth + 1));
				try {
					result.append(name, redacted);
				} catch {
					return mask();
				}
			}
			return result;
		}
		if (input instanceof Map) {
			const result = new Map<unknown, unknown>();
			seen.set(input, result);
			for (const [name, item] of Map.prototype.entries.call(input)) {
				result.set(
					walk(name, undefined, depth + 1),
					walk(item, typeof name === 'string' ? name : undefined, depth + 1),
				);
			}
			return result;
		}
		if (input instanceof Set) {
			const result = new Set<unknown>();
			seen.set(input, result);
			for (const item of Set.prototype.values.call(input)) result.add(walk(item, undefined, depth + 1));
			return result;
		}
		const prototype = Object.getPrototypeOf(input);
		const error = input instanceof Error;
		if (!Array.isArray(input) && !error && prototype !== null && prototype !== Object.prototype) return input;
		const result: object = Array.isArray(input) ? new Array(input.length) : Object.create(prototype);
		seen.set(input, result);
		// JSON.stringify must not execute an own/inherited hook that can recover source data.
		Object.defineProperty(result, 'toJSON', { value: undefined, configurable: true, writable: true });
		const descriptors = Object.getOwnPropertyDescriptors(input);
		const itemKey = descriptors.key && 'value' in descriptors.key ? descriptors.key.value : undefined;
		const keyAware = typeof itemKey === 'string' && policy.keySensitive(itemKey);
		for (const name of Reflect.ownKeys(descriptors)) {
			if (Array.isArray(input) && name === 'length') continue;
			context.spend();
			const descriptor = Reflect.get(descriptors, name) as PropertyDescriptor;
			if (name === 'toJSON' && 'value' in descriptor && typeof descriptor.value === 'function') continue;
			const key = typeof name === 'string' ? name : undefined;
			const itemValue = keyAware && key !== undefined && ['value', 'oldValue', 'newValue'].includes(key);
			if (!('value' in descriptor)) {
				if (itemValue || (key !== undefined && policy.keySensitive(key)))
					Object.defineProperty(result, name, {
						value: mask(),
						enumerable: descriptor.enumerable,
						configurable: true,
						writable: true,
					});
				continue;
			}
			const redacted = walk(
				descriptor.value,
				itemValue ? itemKey : key,
				depth + 1,
				error && (key === 'message' || key === 'stack' || key === 'cause'),
			);
			Object.defineProperty(result, name, { ...descriptor, value: redacted });
		}
		return result;
	}
	try {
		const output = walk(value, key, 0, message);
		return { value: output, sensitive: context.hits > 0 };
	} catch (error) {
		if (!(error instanceof RedactionLimit)) throw error;
		return { value: policy.marker, sensitive: true };
	}
}
