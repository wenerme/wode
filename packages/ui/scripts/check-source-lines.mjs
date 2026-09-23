import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

const packageRoot = resolve(import.meta.dirname, '..');
const sourceRoot = resolve(packageRoot, 'src');
const sourceExtensions = new Set(['.cts', '.mts', '.ts', '.tsx']);
const ignoredDirectories = new Set(['node_modules', 'lib', 'storybook-static']);
const maximumLines = 500;
const violations = [];
let sourceCount = 0;

await inspectDirectory(sourceRoot);

if (violations.length > 0) {
	violations.sort();
	console.error(`UI source line check failed: ${violations.length} file(s) exceed ${maximumLines} lines.`);
	for (const violation of violations) console.error(`- ${violation}`);
	process.exitCode = 1;
} else {
	console.log(`UI source line check passed (${sourceCount} TypeScript source files, maximum ${maximumLines} lines).`);
}

async function inspectDirectory(directory) {
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
		const entryPath = join(directory, entry.name);
		if (entry.isDirectory()) {
			await inspectDirectory(entryPath);
			continue;
		}
		if (entry.isFile() && sourceExtensions.has(extname(entry.name))) await inspectFile(entryPath);
	}
}

async function inspectFile(filePath) {
	const source = await readFile(filePath, 'utf8');
	const lines =
		source.length === 0
			? 0
			: source.split(/\r\n|\n|\r/).length - (source.endsWith('\n') || source.endsWith('\r') ? 1 : 0);
	sourceCount += 1;
	if (lines > maximumLines) violations.push(`${relative(packageRoot, filePath)}: ${lines} lines`);
}
