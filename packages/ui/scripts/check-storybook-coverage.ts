import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

type IndexEntry = { type: 'story' | 'docs'; title: string; importPath: string };

const packageRoot = path.resolve(import.meta.dirname, '..');
const indexPath = path.join(packageRoot, 'storybook-static/index.json');
const index = JSON.parse(readFileSync(indexPath, 'utf8')) as { entries: Record<string, IndexEntry> };
const entries = Object.values(index.entries);
const stories = entries.filter((entry) => entry.type === 'story');
const docs = entries.filter((entry) => entry.type === 'docs');
const helpers = new Set(['daisy', 'utils']);
const sharedStories: Record<string, string> = {
	'header-content-footer-layout': 'resizable',
	'left-center-right-layout': 'resizable',
};
const missing: string[] = [];
let familyCount = 0;

for (const namespace of ['primitive', 'base', 'components']) {
	const namespaceRoot = path.join(packageRoot, 'src', namespace);
	for (const family of readdirSync(namespaceRoot, { withFileTypes: true })) {
		if (!family.isDirectory() || helpers.has(family.name)) continue;
		if (!existsSync(path.join(namespaceRoot, family.name, 'index.ts'))) continue;
		familyCount += 1;
		const storyFamily = namespace === 'components' ? (sharedStories[family.name] ?? family.name) : family.name;
		const prefix = `src/${namespace}/${storyFamily}/`;
		const belongsToFamily = (entry: IndexEntry) =>
			entry.importPath.replaceAll('\\', '/').replace(/^\.\//, '').startsWith(prefix);
		if (!stories.some(belongsToFamily)) missing.push(`${namespace}/${family.name}: no indexed story`);
		if (!docs.some(belongsToFamily)) missing.push(`${namespace}/${family.name}: no indexed documentation`);
	}
}

for (const group of ['Primitive', 'Base', 'Window', 'Console', 'Components']) {
	if (!stories.some((entry) => entry.title.startsWith(`${group}/`))) missing.push(`${group}: no indexed story`);
}

if (missing.length > 0) {
	console.error(`Storybook coverage failed (${missing.length} missing entries):`);
	for (const item of missing) console.error(`- ${item}`);
	process.exitCode = 1;
} else {
	console.log(
		`Storybook coverage passed: ${familyCount} visual families, ${stories.length} stories, ${docs.length} docs.`,
	);
	for (const group of ['Primitive', 'Base', 'Window', 'Console', 'Components']) {
		console.log(`- ${group}: ${stories.filter((entry) => entry.title.startsWith(`${group}/`)).length} stories`);
	}
}
