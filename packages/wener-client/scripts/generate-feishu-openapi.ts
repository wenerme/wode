#!/usr/bin/env node
/**
 * Generate the typed Feishu OpenAPI catalog from larksuite/cli registry metadata.
 *
 * Usage (regenerate after bumping the larksuite/cli clone):
 *   FEISHU_OPENAPI_META=$HOME/gits/larksuite/cli/internal/registry/meta_data.json \
 *   FEISHU_OPENAPI_COMMIT=$(git -C $HOME/gits/larksuite/cli rev-parse HEAD) \
 *     node --import tsx packages/wener-client/scripts/generate-feishu-openapi.ts
 *   FEISHU_OPENAPI_META=... node --import tsx packages/wener-client/scripts/generate-feishu-openapi.ts --check
 *
 * Flags --meta <path> / --commit <sha> override the env vars.
 * service_descriptions.json is read from the same directory as meta_data.json when present.
 * In --check mode without a commit, the one recorded in generated/index.gen.ts is used.
 * Output: src/feishu/openapi/generated/*.gen.ts (biome-ignored) and NOTICE.md.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type RawField = {
	type?: string;
	location?: string;
	required?: boolean;
	description?: string;
	enum?: unknown[];
	options?: Array<{ value: unknown; description?: string }>;
	properties?: Record<string, RawField>;
};
type RawMethod = {
	id: string;
	path: string;
	httpMethod: string;
	description?: string;
	risk: string;
	docUrl?: string;
	danger?: boolean;
	scopes?: string[];
	requiredScopes?: string[];
	accessTokens?: string[];
	parameters?: Record<string, RawField>;
	requestBody?: Record<string, RawField>;
	responseBody?: Record<string, RawField>;
};
type RawService = {
	name: string;
	version: string;
	title?: string;
	description?: string;
	servicePath: string;
	resources: Record<string, { methods: Record<string, RawMethod> }>;
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(scriptDir, '../src/feishu/openapi/generated');

function parseArgs(argv: string[]) {
	const out: { meta?: string; commit?: string; check: boolean } = { check: false };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--check') out.check = true;
		else if (a === '--meta') out.meta = argv[++i];
		else if (a === '--commit') out.commit = argv[++i];
		else if (a.startsWith('--meta=')) out.meta = a.slice(7);
		else if (a.startsWith('--commit=')) out.commit = a.slice(9);
		else if (!a.startsWith('-') && !out.meta) out.meta = a;
		else throw new Error(`Unknown argument: ${a}`);
	}
	out.meta ||= process.env.FEISHU_OPENAPI_META;
	out.commit ||= process.env.FEISHU_OPENAPI_COMMIT;
	return out;
}

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const sortedEntries = <T>(o: Record<string, T> | undefined) => Object.entries(o || {}).sort(([a], [b]) => cmp(a, b));

/** First sentence, single line, capped. */
export function firstSentence(s: string | undefined, max = 120): string {
	if (!s) return '';
	let t = s.split(';;')[0].replace(/\s+/g, ' ').trim();
	const m = /^(.+?)(?:[。！？；]|[.!?;](?=\s|$))/u.exec(t);
	if (m) t = m[1].trim();
	if (t.length > max) t = `${t.slice(0, max - 1).trimEnd()}…`;
	return t;
}

const sq = (s: string) =>
	`'${s
		.replace(/\\/g, '\\\\')
		.replace(/'/g, "\\'")
		.replace(/\n/g, '\\n')
		.replace(/\r/g, '\\r')
		.replace(/\u2028/g, '\\u2028')
		.replace(/\u2029/g, '\\u2029')}'`;
const lit = (v: unknown): string =>
	typeof v === 'string' ? sq(v) : Array.isArray(v) ? `[${v.map(lit).join(', ')}]` : JSON.stringify(v);
const key = (k: string) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : sq(k));
const pascal = (s: string) =>
	s
		.split(/[^A-Za-z0-9]+/)
		.filter(Boolean)
		.map((p) => p[0].toUpperCase() + p.slice(1))
		.join('');

function enumValues(f: RawField): unknown[] {
	if (f.enum?.length) return f.enum;
	if (f.options?.length) {
		const seen = new Set<string>();
		const out: unknown[] = [];
		for (const o of f.options) {
			const k = String(o.value);
			if (seen.has(k)) continue;
			seen.add(k);
			out.push(o.value);
		}
		return out;
	}
	return [];
}

type Mode = 'path' | 'query' | 'body' | 'response';

/** Blank text is treated as absent, so `page_size=` fails when required instead of becoming 0. */
const numericParam = (inner: string) =>
	`z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), ${inner})`;

function scalar(f: RawField, mode: Mode): string {
	const type = f.type || 'string';
	// Response enums stay open so new supplier values do not break parsing.
	const values = mode !== 'response' ? enumValues(f) : [];
	const coerce = mode === 'query' || mode === 'path';
	switch (type) {
		case 'string': {
			if (values.length) return `z.enum(${lit(values.map(String))})`;
			// z.coerce.string() would turn a missing value into 'undefined'; only coerce numbers.
			return mode === 'path' ? 'z.union([z.string(), z.number().transform(String)])' : 'z.string()';
		}
		case 'integer':
		case 'number': {
			const int = type === 'integer' ? '.int()' : '';
			const base = coerce ? numericParam(`z.coerce.number()${int}`) : `z.number()${int}`;
			const nums = values.map(Number).filter((n) => Number.isFinite(n));
			if (nums.length && nums.length === values.length) {
				const e =
					nums.length === 1 ? `z.literal(${nums[0]})` : `z.union([${nums.map((n) => `z.literal(${n})`).join(', ')}])`;
				return coerce ? numericParam(`z.coerce.number().pipe(${e})`) : e;
			}
			return base;
		}
		case 'boolean':
			return coerce ? 'z.union([z.boolean(), z.stringbool()])' : 'z.boolean()';
		case 'file':
			return 'z.unknown()';
		case 'list':
			// A single CLI/HTTP value arrives as a string; wrap it into a one-item list.
			return "z.preprocess((value) => (typeof value === 'string' ? [value] : value), z.array(z.string()))";
		default:
			return 'z.unknown()';
	}
}

function fieldExpr(f: RawField, mode: Mode, indent: string): string {
	let expr: string;
	if (f.type === 'object') {
		expr = f.properties ? objectExpr(f.properties, mode, indent) : 'z.record(z.string(), z.unknown())';
	} else if (f.type === 'array') {
		expr = f.properties ? `z.array(${objectExpr(f.properties, mode, indent)})` : 'z.array(z.unknown())';
	} else {
		expr = scalar(f, mode);
	}
	const d = firstSentence(f.description);
	if (d) expr += `.describe(${lit(d)})`;
	if (!f.required || mode === 'response') expr += '.optional()';
	return expr;
}

function objectExpr(fields: Record<string, RawField>, mode: Mode, indent: string, ctor = 'z.looseObject'): string {
	const entries = sortedEntries(fields);
	if (!entries.length) return `${ctor}({})`;
	const inner = `${indent}\t`;
	const lines = entries.map(([k, f]) => `${inner}${key(k)}: ${fieldExpr(f, mode, inner)},`);
	return `${ctor}({\n${lines.join('\n')}\n${indent}})`;
}

const LICENSE = `MIT License

Copyright (c) 2026 Lark Technologies Pte. Ltd.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

export function generate(meta: { services: RawService[] }, commit: string, titles: Record<string, string>) {
	const header = `// Generated from larksuite/cli internal/registry/meta_data.json @ ${commit} (MIT License, Copyright (c) 2026 Lark Technologies Pte. Ltd.). Do not edit.\n// Regenerate: FEISHU_OPENAPI_META=<meta_data.json> FEISHU_OPENAPI_COMMIT=<sha> node --import tsx packages/wener-client/scripts/generate-feishu-openapi.ts\n`;
	const files = new Map<string, string>();
	const services = [...meta.services].sort((a, b) => cmp(a.name, b.name));
	const index: string[] = [];
	const svcLines: string[] = [];
	const loaderLines: string[] = [];
	const seen = new Set<string>();

	for (const svc of services) {
		const exportName = `FeishuApi${pascal(svc.name)}`;
		const title = titles[svc.name] || svc.title || svc.name;
		svcLines.push(`\t{ name: ${lit(svc.name)}, version: ${lit(svc.version)}, title: ${lit(title)} },`);
		loaderLines.push(`\t${key(svc.name)}: () => import('./${svc.name}.gen').then((m) => m.${exportName}),`);
		const body: string[] = [];
		for (const [resName, res] of sortedEntries(svc.resources)) {
			for (const [methodName, m] of sortedEntries(res.methods)) {
				const id = `${svc.name}.${resName}.${methodName}`;
				if (seen.has(id)) throw new Error(`Duplicate id ${id}`);
				seen.add(id);
				const fullPath = `${svc.servicePath.replace(/\/+$/, '')}/${m.path.replace(/^\/+/, '')}`.replace(/\/+$/, '');
				const scopes = [...new Set([...(m.scopes || []), ...(m.requiredScopes || [])])];
				const tokens = [...(m.accessTokens || [])].sort();
				const params = sortedEntries(m.parameters);
				const pathParams = Object.fromEntries(params.filter(([, p]) => p.location === 'path'));
				const query = Object.fromEntries(params.filter(([, p]) => p.location === 'query'));
				for (const name of fullPath.matchAll(/\{([^}]+)\}/g)) {
					if (!pathParams[name[1]]) pathParams[name[1]] = { type: 'string', required: true };
				}
				const multipart = Object.values(m.requestBody || {}).some((f) => f.type === 'file');
				index.push(
					`\t{ id: ${lit(id)}, service: ${lit(svc.name)}, resource: ${lit(resName)}, method: ${lit(methodName)}, httpMethod: ${lit(m.httpMethod.toUpperCase())}, path: ${lit(fullPath)}, risk: ${lit(m.risk)}, accessTokens: ${lit(tokens)}, scopes: ${lit(scopes)}, summary: ${lit(firstSentence(m.description, 160))}, docUrl: ${lit(m.docUrl || '')}${multipart ? ', multipart: true' : ''} },`,
				);
				const parts: string[] = [];
				const ind = '\t\t';
				if (Object.keys(pathParams).length)
					parts.push(`${ind}pathParams: ${objectExpr(pathParams, 'path', ind, 'z.strictObject')},`);
				if (Object.keys(query).length) parts.push(`${ind}query: ${objectExpr(query, 'query', ind)},`);
				if (m.requestBody && Object.keys(m.requestBody).length)
					parts.push(`${ind}body: ${objectExpr(m.requestBody, 'body', ind)},`);
				if (m.responseBody && Object.keys(m.responseBody).length)
					parts.push(`${ind}response: ${objectExpr(m.responseBody, 'response', ind)},`);
				body.push(`\t${lit(id)}: {\n${parts.join('\n')}${parts.length ? '\n' : ''}\t},`);
			}
		}
		files.set(
			`${svc.name}.gen.ts`,
			`${header}import { z } from 'zod';\nimport type { FeishuApiSchemas } from '../types';\n\nexport const ${exportName} = {\n${body.join('\n')}\n} satisfies Record<string, FeishuApiSchemas>;\n`,
		);
	}

	files.set(
		'index.gen.ts',
		`${header}import type { FeishuApiSchemas, FeishuApiServiceInfo, FeishuApiSummary } from '../types';

export const FeishuApiSourceCommit = ${lit(commit)};

export const FeishuApiServices: readonly FeishuApiServiceInfo[] = [
${svcLines.join('\n')}
];

export const FeishuApiIndex: readonly FeishuApiSummary[] = [
${index.join('\n')}
];

export const FeishuApiServiceLoaders: Record<string, () => Promise<Record<string, FeishuApiSchemas>>> = {
${loaderLines.join('\n')}
};
`,
	);
	return files;
}

function main() {
	const args = parseArgs(process.argv.slice(2));
	if (!args.meta) throw new Error('Missing metadata path: pass --meta <meta_data.json> or set FEISHU_OPENAPI_META');
	const indexFile = path.join(outDir, 'index.gen.ts');
	if (!args.commit && args.check && existsSync(indexFile)) {
		args.commit = /FeishuApiSourceCommit = '([^']+)'/.exec(readFileSync(indexFile, 'utf8'))?.[1];
	}
	if (!args.commit) throw new Error('Missing source commit: pass --commit <sha> or set FEISHU_OPENAPI_COMMIT');
	const meta = JSON.parse(readFileSync(args.meta, 'utf8'));
	const descPath = path.join(path.dirname(args.meta), 'service_descriptions.json');
	const titles: Record<string, string> = {};
	if (existsSync(descPath)) {
		for (const [k, v] of Object.entries(JSON.parse(readFileSync(descPath, 'utf8')) as Record<string, any>)) {
			if (v?.en?.title) titles[k] = v.en.title;
		}
	}
	const files = generate(meta, args.commit, titles);
	const noticePath = path.resolve(outDir, '../NOTICE.md');
	const notice = `# Third-party notice\n\nFiles under \`generated/\` are derived from \`internal/registry/meta_data.json\` and \`internal/registry/service_descriptions.json\` of [larksuite/cli](https://github.com/larksuite/cli) at commit \`${args.commit}\`, licensed under the MIT License:\n\n\`\`\`text\n${LICENSE}\`\`\`\n`;

	if (args.check) {
		const diffs: string[] = [];
		const existing = existsSync(outDir) ? readdirSync(outDir).filter((f) => f.endsWith('.ts')) : [];
		for (const f of existing) if (!files.has(f)) diffs.push(`extra: ${f}`);
		for (const [f, content] of files) {
			const p = path.join(outDir, f);
			if (!existsSync(p) || readFileSync(p, 'utf8') !== content) diffs.push(`changed: ${f}`);
		}
		if (!existsSync(noticePath) || readFileSync(noticePath, 'utf8') !== notice) diffs.push('changed: NOTICE.md');
		if (diffs.length) {
			console.error(`Feishu OpenAPI catalog is out of date:\n${diffs.join('\n')}`);
			process.exit(1);
		}
		console.log(`Feishu OpenAPI catalog up to date (${files.size} files)`);
		return;
	}
	if (existsSync(outDir)) rmSync(outDir, { recursive: true });
	mkdirSync(outDir, { recursive: true });
	for (const [f, content] of files) writeFileSync(path.join(outDir, f), content);
	writeFileSync(noticePath, notice);
	console.log(`Wrote ${files.size} files to ${outDir}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
