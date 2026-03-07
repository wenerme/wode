const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export interface ParsedFrontmatter<T extends Record<string, unknown> = Record<string, unknown>> {
	frontmatter: T;
	content: string;
	raw: string;
}

/** Parse YAML frontmatter from a markdown string. Uses simple key: value parsing, no YAML dep. */
export function parseFrontmatter<T extends Record<string, unknown> = Record<string, unknown>>(raw: string): ParsedFrontmatter<T> {
	const match = raw.match(FRONTMATTER_RE);
	if (!match) {
		return { frontmatter: {} as T, content: raw, raw };
	}
	const fm = parseSimpleYaml(match[1]) as T;
	const content = raw.slice(match[0].length);
	return { frontmatter: fm, content, raw };
}

/** Serialize frontmatter + body back to a string. */
export function stringifyFrontmatter(fm: Record<string, unknown>, body: string): string {
	const lines = Object.entries(fm)
		.filter(([, v]) => v !== undefined && v !== null)
		.map(([k, v]) => `${k}: ${v}`);
	if (lines.length === 0) return body;
	return `---\n${lines.join('\n')}\n---\n\n${body}`;
}

/**
 * Merge updates into existing frontmatter of a markdown string.
 * Returns the new full content string.
 */
export function mergeFrontmatter(raw: string, updates: Record<string, unknown>): string {
	const { frontmatter, content } = parseFrontmatter(raw);
	Object.assign(frontmatter, updates);
	return stringifyFrontmatter(frontmatter, content);
}

/** Simple YAML-like parser for flat key: value frontmatter. */
function parseSimpleYaml(text: string): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const line of text.split('\n')) {
		const idx = line.indexOf(':');
		if (idx === -1) continue;
		const key = line.slice(0, idx).trim();
		const val = line.slice(idx + 1).trim();
		if (!key) continue;
		// Try to parse as number/boolean
		if (val === 'true') result[key] = true;
		else if (val === 'false') result[key] = false;
		else if (val !== '' && !isNaN(Number(val))) result[key] = Number(val);
		else result[key] = val;
	}
	return result;
}
