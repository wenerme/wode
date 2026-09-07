import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '../../..');
const options = parseOptions(process.argv.slice(2));
const roots = (options.roots.length > 0 ? options.roots : ['apps/components', 'packages/ui']).map((root) =>
	resolve(repoRoot, root),
);
const maximumLines = options.maximumLines;
const sourceExtensions = new Set(['.cts', '.mts', '.ts', '.tsx']);
const excludedDirectories = new Set(['.git', 'node_modules']);
const excludedPaths = new Set([
	'apps/components/.vite',
	'apps/components/.waku',
	'apps/components/build',
	'apps/components/coverage',
	'apps/components/dist',
	'packages/ui/build',
	'packages/ui/coverage',
	'packages/ui/dist',
	'packages/ui/lib',
]);
const violations = [];
let sourceCount = 0;
let generatedCount = 0;

for (const root of roots) await inspectPath(root);

if (violations.length > 0) {
	violations.sort((left, right) => left.path.localeCompare(right.path));
	console.error(`UI source line check failed: ${violations.length} file(s) exceed ${maximumLines} lines.`);
	for (const { path, lines, generated } of violations)
		console.error(`- ${path}: ${lines} lines${generated ? ' (generated)' : ''}`);
	console.error('Split each file by stable responsibility; generated files require generator-aware remediation.');
	process.exitCode = 1;
} else {
	console.log(
		`UI source line check passed (${sourceCount} TypeScript source files, ${generatedCount} generated, maximum ${maximumLines} lines).`,
	);
}

async function inspectDirectory(directory) {
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
		const path = join(directory, entry.name);
		if (entry.isDirectory() && excludedPaths.has(relative(repoRoot, path).replaceAll('\\', '/'))) continue;
		if (entry.isSymbolicLink()) {
			if (sourceExtensions.has(extname(entry.name))) await inspectPath(path);
			continue;
		}
		if (entry.isDirectory()) {
			await inspectDirectory(path);
			continue;
		}
		if (entry.isFile()) await inspectFile(path);
	}
}

async function inspectPath(path) {
	const entry = await stat(path);
	if (entry.isDirectory()) {
		await inspectDirectory(path);
		return;
	}
	if (entry.isFile()) await inspectFile(path);
}

async function inspectFile(path) {
	if (!sourceExtensions.has(extname(path))) return;
	const source = await readFile(path, 'utf8');
	const lines = countPhysicalLines(source);
	const generated = isGeneratedSource(path, source);
	sourceCount += 1;
	if (generated) generatedCount += 1;
	if (lines > maximumLines) violations.push({ path: relative(repoRoot, path), lines, generated });
}

function countPhysicalLines(source) {
	if (source.length === 0) return 0;
	return source.split(/\r\n|\n|\r/).length - (source.endsWith('\n') || source.endsWith('\r') ? 1 : 0);
}

function isGeneratedSource(path, source) {
	const normalizedPath = relative(repoRoot, path).replaceAll('\\', '/');
	return (
		/(?:^|\/)(?:generated)(?:\/|$)/.test(normalizedPath) ||
		/(?:\.gen|\.generated)\.(?:[cm]?ts|tsx)$/.test(normalizedPath) ||
		/^\s*\/\/(?:.*\b(?:auto-?generated|generated file)\b.*|\s*DO NOT EDIT\b)/im.test(source.slice(0, 2_048))
	);
}

function parseOptions(args) {
	const options = { maximumLines: 500, roots: [] };
	for (let index = 0; index < args.length; index += 1) {
		const argument = args[index];
		if (argument === '--root') {
			const root = args[index + 1];
			if (!root) throw new Error('--root requires a path');
			options.roots.push(root);
			index += 1;
			continue;
		}
		if (argument === '--max-lines') {
			const parsed = Number(args[index + 1]);
			if (!Number.isSafeInteger(parsed) || parsed < 1) throw new Error('--max-lines must be a positive integer');
			options.maximumLines = parsed;
			index += 1;
			continue;
		}
		throw new Error(`Unknown argument: ${argument}`);
	}
	return options;
}
