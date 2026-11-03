import {
	isAlias,
	isMap,
	isScalar,
	isSeq,
	parseDocument as parseYamlDocument,
	type YAMLMap,
	type YAMLSeq,
	type Node as YamlNode,
	type Pair as YamlPair,
} from 'yaml';

export interface ApolloRedactionOptions {
	marker?: string;
	redact?: boolean;
	key?: string;
}

const DefaultMarker = '<redacted>';
const SensitiveKeyWords = new Set([
	'password',
	'passwd',
	'pwd',
	'passphrase',
	'secret',
	'secrets',
	'token',
	'tokens',
	'auth',
	'authorization',
	'credential',
	'credentials',
	'dsn',
	'dsns',
	'cookie',
	'cookies',
	'apikey',
	'apikeys',
	'accesskey',
	'secretkey',
	'privatekey',
	'signkey',
	'appkey',
	'sk',
	'connstr',
	'connectionstring',
]);
// A bare `key` is not sensitive (Apollo item rows are `{ key, value }`); only these compounds are.
const SensitiveKeyPairs = new Set(
	[
		'api',
		'access',
		'private',
		'secret',
		'sign',
		'signing',
		'app',
		'encrypt',
		'encryption',
		'hmac',
		'jwt',
		'master',
	].flatMap((prefix) => [`${prefix}.key`, `${prefix}.keys`]),
);
/** `user:password@host` userinfo outside of `scheme://` URLs, e.g. Go MySQL DSN `user:pass@tcp(host)/db`. */
const DsnUserInfoPattern = /(^|[\s"'=(,:[{])([^\s"'=:@/,;()[\]{}]*):([^\s"']+)@(?=[^\s"'@])/gu;
const CredentialTokenPatterns: ReadonlyArray<[RegExp, string]> = [
	[/\b(sk-(?:ant-|proj-|live-|test-)?)[A-Za-z0-9_-]{16,}/gu, '$1'],
	[/\b(gh[pousr]_)[A-Za-z0-9]{20,}/gu, '$1'],
	[/\b(github_pat_)[A-Za-z0-9_]{20,}/gu, '$1'],
	[/\b(glpat-)[A-Za-z0-9_-]{16,}/gu, '$1'],
	[/\b(xox[abposr]-)[A-Za-z0-9-]{10,}/gu, '$1'],
	[/\b(AKIA|ASIA)[A-Z0-9]{16}\b/gu, '$1'],
	[/\b(AIza)[A-Za-z0-9_-]{30,}/gu, '$1'],
	[/\b(eyJ)[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/gu, '$1'],
	[/\b((?:Bearer|Basic)\s+)[A-Za-z0-9._~+/-]{16,}=*/gu, '$1'],
];
const PemPrivateKeyPattern = /(-----BEGIN [A-Z ]*PRIVATE KEY-----)[\s\S]*?(-----END [A-Z ]*PRIVATE KEY-----)/gu;
const AssignmentStartPattern = /(^|[^A-Za-z0-9_.-])(["']?)([A-Za-z][A-Za-z0-9_.-]*)\2(\s*[:=]\s*)/gu;
const EmbeddedUrlPattern = /\b[a-z][a-z\d+.-]*:\/\/[^\s"'<>]+/giu;
const UrlUserInfoPattern = /^([a-z][a-z\d+.-]*:\/\/)[^@/?#\s]+@/iu;
const UrlQueryParameterPattern = /([?&])([^=&#\s]+)(?:=([^&#\s]*))?/gu;

export function isApolloSensitiveKey(key: string): boolean {
	const words = key
		.replace(/([a-z\d])([A-Z])/gu, '$1_$2')
		.toLowerCase()
		.split(/[^a-z\d]+/u)
		.filter(Boolean);
	if (words.some((word) => SensitiveKeyWords.has(word))) return true;
	return words.some((word, index) => SensitiveKeyPairs.has(`${word}.${words[index + 1] ?? ''}`));
}

export function redactApolloValue(value: unknown, options: ApolloRedactionOptions = {}): unknown {
	if (options.redact === false) return value;
	const marker = options.marker ?? DefaultMarker;
	if (options.key && isApolloSensitiveKey(options.key)) return marker;
	if (value === null || value === undefined || typeof value === 'boolean' || typeof value === 'number') return value;
	if (typeof value === 'string') return redactApolloText(value, { ...options, marker });
	if (typeof value === 'bigint') return value.toString();
	if (Array.isArray(value)) return value.map((item) => redactApolloValue(item, { ...options, marker, key: undefined }));
	if (!isRecord(value)) return value;

	const itemKey = typeof value.key === 'string' ? value.key : undefined;
	const sensitiveItem = itemKey !== undefined && isApolloSensitiveKey(itemKey);
	return Object.fromEntries(
		Object.entries(value).map(([entryKey, entryValue]) => {
			const itemValue = sensitiveItem && ['value', 'oldValue', 'newValue'].includes(entryKey);
			return [
				entryKey,
				itemValue || isApolloSensitiveKey(entryKey)
					? marker
					: redactApolloValue(entryValue, { ...options, marker, key: entryKey }),
			];
		}),
	);
}

export function redactApolloText(value: string, options: ApolloRedactionOptions = {}): string {
	if (options.redact === false) return value;
	const marker = options.marker ?? DefaultMarker;
	if (options.key && isApolloSensitiveKey(options.key)) return marker;
	try {
		const parsed = JSON.parse(value) as unknown;
		return JSON.stringify(redactApolloValue(parsed, { marker }));
	} catch {
		// Configuration namespaces also contain properties, YAML, and arbitrary text.
	}
	const yaml = redactApolloYaml(value, marker);
	const url = redactApolloUrls(yaml.value, marker);
	return redactApolloCredentialShapes(redactApolloAssignments(url, marker), marker);
}

/**
 * Line-oriented redaction for free text such as error messages: URL credentials, `key=value`/`key: value`
 * assignments with sensitive keys and credential-shaped values. Never parses YAML, so text is never collapsed.
 */
export function redactApolloMessage(value: string, options: ApolloRedactionOptions = {}): string {
	const marker = options.marker ?? DefaultMarker;
	return redactApolloCredentialShapes(redactApolloAssignments(redactApolloUrls(value, marker), marker), marker);
}

/** Masks credential-shaped values regardless of their key: DSN userinfo, well-known token prefixes, PEM keys. */
export function redactApolloCredentialShapes(value: string, marker: string = DefaultMarker): string {
	let output = value.replace(PemPrivateKeyPattern, `$1${marker}$2`);
	// The password runs to the last `@` of the token (Go DSNs allow `@` in passwords); `//…` is a URL scheme
	// whose userinfo the URL pass already handled.
	output = output.replace(DsnUserInfoPattern, (full, lead: string, user: string, password: string) =>
		password.includes(marker) || password.startsWith('//') ? full : `${lead}${user}:${marker}@`,
	);
	for (const [pattern, keep] of CredentialTokenPatterns) output = output.replace(pattern, `${keep}${marker}`);
	return output;
}

function redactApolloYaml(value: string, marker: string): ApolloYamlRedaction {
	let document: ReturnType<typeof parseYamlDocument>;
	try {
		document = parseYamlDocument(value);
	} catch {
		return { value: marker, structured: true };
	}
	if (document.errors.length || document.warnings.length) return { value: marker, structured: true };
	if (!isMap(document.contents) && !isSeq(document.contents)) return { value, structured: false };

	const replacements: ApolloYamlReplacement[] = [];
	const state = { unsafe: false };
	collectApolloYamlReplacements(document.contents, value, apolloYamlMarker(marker), replacements, state);
	if (state.unsafe) return { value: marker, structured: true };

	let output = value;
	let nextStart = value.length;
	for (const replacement of replacements.sort((left, right) => right.start - left.start)) {
		if (replacement.end > nextStart) return { value: marker, structured: true };
		output = output.slice(0, replacement.start) + replacement.value + output.slice(replacement.end);
		nextStart = replacement.start;
	}
	return { value: output, structured: true };
}

function apolloYamlMarker(marker: string): string {
	const document = parseYamlDocument(marker);
	return !document.errors.length &&
		!document.warnings.length &&
		isScalar(document.contents) &&
		document.contents.value === marker
		? marker
		: JSON.stringify(marker);
}

function collectApolloYamlReplacements(
	node: YAMLMap<unknown, unknown> | YAMLSeq<unknown>,
	source: string,
	marker: string,
	replacements: ApolloYamlReplacement[],
	state: { unsafe: boolean },
): void {
	if (isSeq(node)) {
		for (const item of node.items)
			if (isMap(item) || isSeq(item)) collectApolloYamlReplacements(item, source, marker, replacements, state);
		return;
	}

	const pairs = node.items.map((pair) => ({ pair, key: apolloYamlPairKey(pair) }));
	if (pairs.some(({ pair }) => isAlias(pair.key))) {
		state.unsafe = true;
		return;
	}
	const itemKey = pairs.find(({ key }) => key === 'key')?.pair.value;
	if (isAlias(itemKey)) {
		state.unsafe = true;
		return;
	}
	const keyAware = isScalar(itemKey) && typeof itemKey.value === 'string' && isApolloSensitiveKey(itemKey.value);
	for (const { pair, key } of pairs) {
		const sensitiveValue =
			key !== undefined && (isApolloSensitiveKey(key) || (keyAware && ['value', 'oldValue', 'newValue'].includes(key)));
		if (sensitiveValue) {
			addApolloYamlReplacement(pair.value, source, marker, replacements, state);
		} else if (isMap(pair.value) || isSeq(pair.value)) {
			collectApolloYamlReplacements(pair.value, source, marker, replacements, state);
		}
	}
}

function apolloYamlPairKey(pair: YamlPair<unknown, unknown>): string | undefined {
	return isScalar(pair.key) && typeof pair.key.value === 'string' ? pair.key.value : undefined;
}

function addApolloYamlReplacement(
	node: unknown,
	source: string,
	marker: string,
	replacements: ApolloYamlReplacement[],
	state: { unsafe: boolean },
): void {
	if (!isYamlNode(node) || isAlias(node)) {
		state.unsafe = true;
		return;
	}
	const range = node.range;
	const start = range?.[0];
	const end = range?.[1];
	if (
		!Number.isInteger(start) ||
		!Number.isInteger(end) ||
		start === undefined ||
		end === undefined ||
		start < 0 ||
		start >= end ||
		end > source.length
	) {
		state.unsafe = true;
		return;
	}
	const trailingLineBreak = source.slice(start, end).match(/(?:\r\n|\n|\r)$/u)?.[0] ?? '';
	replacements.push({ start, end, value: marker + trailingLineBreak });
}

function isYamlNode(value: unknown): value is YamlNode {
	return isAlias(value) || isScalar(value) || isMap(value) || isSeq(value);
}

interface ApolloYamlRedaction {
	value: string;
	structured: boolean;
}

interface ApolloYamlReplacement {
	start: number;
	end: number;
	value: string;
}

function redactApolloAssignments(value: string, marker: string): string {
	return splitApolloTextLines(value)
		.map((line) => redactApolloAssignmentLine(line.text, marker) + line.ending)
		.join('');
}

function redactApolloAssignmentLine(line: string, marker: string): string {
	const assignments: ApolloAssignmentStart[] = [];
	AssignmentStartPattern.lastIndex = 0;
	for (let match = AssignmentStartPattern.exec(line); match; match = AssignmentStartPattern.exec(line)) {
		assignments.push({
			start: match.index,
			keyStart: match.index + match[1].length,
			key: match[3],
			separator: match[4],
			valueStart: AssignmentStartPattern.lastIndex,
		});
	}
	const sensitive = assignments.filter((assignment) => isApolloSensitiveKey(assignment.key));
	if (!sensitive.length) return line;

	const first = assignments[0];
	const propertyLine =
		first === sensitive[0] && first.keyStart === leadingIndent(line) && first.separator.includes('=');
	if (propertyLine) return line.slice(0, first.valueStart) + marker;

	let output = line;
	for (let index = assignments.length - 1; index >= 0; index -= 1) {
		const assignment = assignments[index];
		if (!isApolloSensitiveKey(assignment.key)) continue;
		const end = assignments[index + 1]?.start ?? line.length;
		const current = output.slice(assignment.valueStart, end);
		// Empty values (YAML block keys like `credentials:`) and comments carry nothing to mask; replacing
		// them would corrupt the structure, e.g. `credentials:***` makes the YAML invalid.
		if (current.includes(marker) || !current.trim() || current.trimStart().startsWith('#')) continue;
		output = output.slice(0, assignment.valueStart) + marker + output.slice(end);
	}
	return output;
}

function leadingIndent(value: string): number {
	return value.match(/^[ \t]*/u)?.[0].length ?? 0;
}

type ApolloTextLine = { text: string; ending: string };
type ApolloAssignmentStart = {
	start: number;
	keyStart: number;
	key: string;
	separator: string;
	valueStart: number;
};

function splitApolloTextLines(value: string): ApolloTextLine[] {
	const parts = value.split(/(\r\n|\n|\r)/u);
	const lines: ApolloTextLine[] = [];
	for (let index = 0; index < parts.length; index += 2) {
		lines.push({ text: parts[index] ?? '', ending: parts[index + 1] ?? '' });
	}
	return lines;
}

function redactApolloUrls(value: string, marker: string): string {
	return value.replace(EmbeddedUrlPattern, (token) => {
		const trailing = token.match(/[),.;!?\]}]+$/u)?.[0] ?? '';
		const url = token.slice(0, token.length - trailing.length);
		const redacted = url
			.replace(UrlUserInfoPattern, `$1${marker}@`)
			.replace(UrlQueryParameterPattern, (full, separator: string, rawKey: string) => {
				return isApolloSensitiveKey(decodeUrlComponent(rawKey)) ? `${separator}${rawKey}=${marker}` : full;
			});
		return redacted + trailing;
	});
}

function decodeUrlComponent(value: string): string {
	try {
		return decodeURIComponent(value.replace(/\+/gu, ' '));
	} catch {
		return value;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
