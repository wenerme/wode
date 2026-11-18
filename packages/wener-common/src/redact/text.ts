import { redactCredentialShapes } from './credentials';
import type { RedactionContext } from './policy';
import { redactYaml } from './yaml';

const AssignmentStartPattern = /(^|[^A-Za-z0-9_.-])(["']?)([A-Za-z][A-Za-z0-9_.-]*)\2(\s*[:=]\s*)/gu;
const EmbeddedUrlPattern = /\b[a-z][a-z\d+.-]*:\/\/[^\s"'<>]+/giu;
const UrlUserInfoPattern = /^([a-z][a-z\d+.-]*:\/\/)[^@/?#\s]+@/iu;
const UrlQueryParameterPattern = /([?&])([^=&#\s]+)(?:=([^&#\s]*))?/gu;

export function redactTextValue(
	value: string,
	context: RedactionContext,
	walk: (value: unknown, key?: string) => unknown,
): string {
	if (value.length > context.policy.maxTextLength) {
		context.mark();
		return context.policy.marker;
	}
	if (/^\s*[[{"]/u.test(value)) {
		let parsed: unknown;
		let valid = false;
		try {
			parsed = JSON.parse(value);
			valid = true;
		} catch {
			/* Other configuration formats. */
		}
		if (valid) {
			const hits = context.hits;
			const result = walk(parsed);
			return hits === context.hits ? value : JSON.stringify(result);
		}
	}
	const yaml = redactYaml(value, context, walk);
	return yaml.structured ? yaml.value : redactMessageValue(value, context, walk);
}

/** Never parses JSON or YAML: error diagnostics must retain their individual lines. */
export function redactMessageValue(
	value: string,
	context: RedactionContext,
	walk: (value: unknown, key?: string) => unknown,
): string {
	if (value.length > context.policy.maxTextLength) {
		context.mark();
		return context.policy.marker;
	}
	const { policy } = context;
	const parts = value.split(/(\r\n|\n|\r)/u);
	for (let index = 0; index < parts.length; index += 2) parts[index] = redactAssignmentLine(parts[index], context);
	const output = parts.join('').replace(EmbeddedUrlPattern, (token) => {
		const trailing = token.match(/[),.;!?\]}]+$/u)?.[0] ?? '';
		const url = token.slice(0, token.length - trailing.length);
		return (
			url
				.replace(UrlUserInfoPattern, (_full, scheme: string) => {
					context.mark();
					return `${scheme}${policy.marker}@`;
				})
				.replace(UrlQueryParameterPattern, (full, separator: string, rawKey: string, rawValue?: string) => {
					const hits = context.hits;
					walk(decode(rawValue ?? ''), decode(rawKey));
					if (hits === context.hits) return full;
					return `${separator}${rawKey}=${policy.marker}`;
				}) + trailing
		);
	});
	const shaped = redactCredentialShapes(output, policy.marker, () => context.mark());
	return policy.literals(shaped, () => context.mark());
}

interface Assignment {
	start: number;
	keyStart: number;
	key: string;
	separator: string;
	valueStart: number;
}

function redactAssignmentLine(line: string, context: RedactionContext): string {
	const assignments: Assignment[] = [];
	// Query values have decoding and '&' boundaries; only the URL pass should interpret them.
	const queries: { start: number; end: number }[] = [];
	for (const match of line.matchAll(EmbeddedUrlPattern)) {
		const start = match[0].indexOf('?');
		const hash = match[0].indexOf('#');
		if (start >= 0 && (hash < 0 || start < hash))
			queries.push({ start: match.index + start + 1, end: match.index + (hash < 0 ? match[0].length : hash) });
	}
	let queryIndex = 0;
	// A fresh regexp avoids shared lastIndex during reentrant custom rules.
	const pattern = new RegExp(AssignmentStartPattern.source, AssignmentStartPattern.flags);
	for (let match = pattern.exec(line); match; match = pattern.exec(line)) {
		const keyStart = match.index + match[1].length;
		while (queryIndex < queries.length && queries[queryIndex].end <= keyStart) queryIndex++;
		if (queryIndex < queries.length && keyStart >= queries[queryIndex].start) continue;
		context.spend();
		assignments.push({
			start: match.index,
			keyStart,
			key: match[3],
			separator: match[4],
			valueStart: pattern.lastIndex,
		});
		// The previous separator may include the boundary before another assignment
		// (e.g. `TypeError: password=...`). Allow that boundary to be reused.
		if (!context.policy.keySensitive(match[3])) pattern.lastIndex -= 1;
	}
	const sensitive = assignments.filter((assignment, index) =>
		context.policy.shouldMask(
			line.slice(assignment.valueStart, assignments[index + 1]?.start ?? line.length),
			assignment.key,
		),
	);
	if (!sensitive.length) return line;
	const first = assignments[0];
	if (
		first === sensitive[0] &&
		first.keyStart === (line.match(/^[ \t]*/u)?.[0].length ?? 0) &&
		first.separator.includes('=')
	) {
		context.mark();
		return line.slice(0, first.valueStart) + context.policy.marker;
	}
	let output = line;
	for (let index = assignments.length - 1; index >= 0; index -= 1) {
		const assignment = assignments[index];
		if (!sensitive.includes(assignment)) continue;
		const end = assignments[index + 1]?.start ?? line.length;
		const current = output.slice(assignment.valueStart, end);
		if (!current.trim() || current.trimStart().startsWith('#')) continue;
		context.mark();
		output = output.slice(0, assignment.valueStart) + context.policy.marker + output.slice(end);
	}
	return output;
}

function decode(value: string): string {
	try {
		return decodeURIComponent(value.replace(/\+/gu, ' '));
	} catch {
		return value;
	}
}
