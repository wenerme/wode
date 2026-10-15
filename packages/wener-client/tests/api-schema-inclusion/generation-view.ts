type Schema = Record<string, unknown>;

/** Expand refs for the faker, bounding optional recursion; the independent validation schema is untouched. */
export function generationView(schema: Schema, definitions: Record<string, Schema>, seed = 1): Schema {
	let state = seed >>> 0;
	function random(): number {
		state += 0x6d2b79f5;
		let value = Math.imul(state ^ (state >>> 15), 1 | state);
		value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	}
	const references = new Map<string, Set<string>>();
	function collect(value: unknown, refs: Set<string>): void {
		if (value === null || typeof value !== 'object') return;
		if ('$ref' in value && typeof value.$ref === 'string') refs.add(value.$ref.slice('#/$defs/'.length));
		for (const child of Object.values(value)) collect(child, refs);
	}
	for (const [name, definition] of Object.entries(definitions)) {
		const refs = new Set<string>();
		collect(definition, refs);
		references.set(name, refs);
	}
	const cyclic = new Set<string>();
	for (const name of references.keys()) {
		const visited = new Set<string>();
		const pending = [...(references.get(name) ?? [])];
		while (pending.length) {
			const next = pending.pop() as string;
			if (next === name) {
				cyclic.add(name);
				break;
			}
			if (visited.has(next)) continue;
			visited.add(next);
			pending.push(...(references.get(next) ?? []));
		}
	}
	const cache = new Map<string, Schema | boolean | undefined>();
	function expand(value: Schema | boolean, ancestors: string[] = []): Schema | boolean | undefined {
		if (typeof value === 'boolean') return value || undefined;
		if (value.not === true || (value.not && typeof value.not === 'object' && Object.keys(value.not).length === 0))
			return undefined;
		if (typeof value.$ref === 'string') {
			const name = value.$ref.slice('#/$defs/'.length).replaceAll('~1', '/').replaceAll('~0', '~');
			if (ancestors.filter((ancestor) => ancestor === name).length >= 2) return undefined;
			if (!definitions[name]) throw new Error(`Missing generation reference: ${name}`);
			const key = `${name}:${ancestors
				.filter((ancestor) => cyclic.has(ancestor))
				.sort()
				.join(',')}`;
			const target = cache.has(key) ? cache.get(key) : expand(definitions[name], [...ancestors, name]);
			if (!cache.has(key)) cache.set(key, target);
			const { $ref: _ref, ...siblings } = value;
			return target === undefined || Object.keys(siblings).length === 0
				? target
				: { allOf: [target, expand(siblings, ancestors)] };
		}
		const result: Schema = { ...value };
		delete result.$defs;
		const types = Array.isArray(result.type) ? result.type : [result.type];
		if (types.includes('array'))
			result.maxItems = Math.max(Number(result.minItems ?? 0), Math.min(Number(result.maxItems ?? 2), 2));
		if (
			types.includes('string') &&
			result.pattern === undefined &&
			result.enum === undefined &&
			result.const === undefined
		) {
			result.maxLength = Math.max(Number(result.minLength ?? 0), Math.min(Number(result.maxLength ?? 64), 64));
		}
		for (const keyword of ['anyOf', 'oneOf', 'allOf']) {
			if (!Array.isArray(value[keyword])) continue;
			const branches = value[keyword] as Schema[];
			if (keyword !== 'allOf') {
				const start = Math.floor(random() * branches.length);
				let selected: Schema | boolean | undefined;
				for (let index = 0; index < branches.length && selected === undefined; index++) {
					selected = expand(branches[(start + index) % branches.length], ancestors);
				}
				if (selected === undefined) return undefined;
				result[keyword] = [selected];
				continue;
			}
			const children = branches.map((child) => expand(child, ancestors));
			if (keyword === 'allOf' && children.includes(undefined)) return undefined;
			const remaining = children.filter((child) => child !== undefined);
			if (!remaining.length) return undefined;
			result[keyword] = remaining;
		}
		if (value.properties && typeof value.properties === 'object') {
			const required = new Set((value.required as string[] | undefined) ?? []);
			const properties: Schema = {};
			for (const [name, child] of Object.entries(value.properties)) {
				const expanded = expand(child, ancestors);
				if (expanded === undefined && required.has(name)) return undefined;
				if (expanded !== undefined) properties[name] = expanded;
			}
			result.properties = properties;
		}
		if (
			result.properties &&
			value.not &&
			typeof value.not === 'object' &&
			'required' in value.not &&
			Array.isArray(value.not.required)
		) {
			const required = new Set<string>();
			function requiredKeys(node: Schema): void {
				for (const name of (node.required as string[] | undefined) ?? []) required.add(name);
				for (const keyword of ['allOf', 'anyOf', 'oneOf']) {
					for (const child of (node[keyword] as Schema[] | undefined) ?? []) requiredKeys(child);
				}
			}
			requiredKeys(result);
			const optional = (value.not.required as string[]).filter((name) => !required.has(name));
			if (!optional.length) return undefined;
			delete (result.properties as Schema)[optional[Math.floor(random() * optional.length)]];
		}
		if (value.items && typeof value.items === 'object' && !Array.isArray(value.items)) {
			const items = expand(value.items as Schema, ancestors);
			if (items === undefined) {
				if (Number(value.minItems ?? 0) > 0) return undefined;
				result.items = false;
				result.maxItems = 0;
			} else result.items = items;
		}
		if (typeof value.additionalProperties === 'object' && value.additionalProperties !== null) {
			result.additionalProperties = expand(value.additionalProperties as Schema, ancestors) ?? false;
		}
		if (types.includes('integer')) {
			result.minimum = Math.max(Number(result.minimum ?? Number.MIN_SAFE_INTEGER), Number.MIN_SAFE_INTEGER);
			result.maximum = Math.min(Number(result.maximum ?? Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
		}
		return result;
	}
	const result = expand(schema);
	if (!result || typeof result !== 'object')
		throw new Error('Official root has no finite sample within the recursion budget');
	return result;
}
