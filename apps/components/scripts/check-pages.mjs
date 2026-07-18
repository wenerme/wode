import { access, readFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDir = join(appRoot, 'storybook-static');
const registry = JSON.parse(await readFile(join(appRoot, 'registry.json'), 'utf8'));

for (const file of ['index.html', 'iframe.html', 'index.json', 'r/registry.json', 'manifests/components.json']) {
	await assertFile(file);
}

const componentsManifest = JSON.parse(await readFile(join(outputDir, 'manifests/components.json'), 'utf8'));
if (componentsManifest.v !== 1 || Object.keys(componentsManifest.components ?? {}).length === 0) {
	throw new Error('Storybook components manifest is missing component metadata');
}
for (const component of Object.values(componentsManifest.components)) {
	for (const reference of [component.docgen?.$ref, component.stories?.$ref]) {
		if (typeof reference !== 'string') throw new Error(`Missing Storybook component reference: ${component.id}`);
		const [referencePath, fragment] = reference.split('#', 2);
		if (!referencePath || !fragment?.startsWith('/'))
			throw new Error(`Invalid Storybook component reference: ${reference}`);
		const targetPath = resolve(outputDir, 'manifests', referencePath);
		const targetRelativePath = relative(outputDir, targetPath);
		if (targetRelativePath.startsWith('..') || isAbsolute(targetRelativePath)) {
			throw new Error(`Storybook component reference escapes output: ${reference}`);
		}
		await assertFile(targetRelativePath);
		const targetDocument = JSON.parse(await readFile(targetPath, 'utf8'));
		if (resolveJsonPointer(targetDocument, fragment) === undefined) {
			throw new Error(`Missing Storybook component reference target: ${reference}`);
		}
	}
}

for (const item of registry.items) {
	await assertFile(`r/${item.name}.json`);
}

const storyIndex = JSON.parse(await readFile(join(outputDir, 'index.json'), 'utf8'));
const storyIds = Object.entries(storyIndex.entries)
	.filter(([, entry]) => entry.type === 'story')
	.map(([id]) => id);

for (const requiredStory of [
	'overview-registry--catalog',
	'primitives-zoom--default',
	'utilities-formats--catalog',
	'utilities-hook-form--profile-form',
	'utilities-web-vitals--reporter',
	'utilities-update-notification--state-and-display',
	'utilities-query-builder--schema-driven',
	'utilities-query-builder--interaction-regression',
	'console-shell--expanded',
	'console-data-view--interactive',
	'console-data-view--large-dataset',
	'console-record-detail--contact',
	'console-window--workspace',
	'ui-addressable-frame--frame',
	'ui-addressable-frame--file',
	'ui-path-address-bar--interactive',
	'ui-path-address-bar--responsive-overflow',
	'ui-file-viewer--editable-text',
	'ui-file-viewer--media-catalog',
	'ui-file-viewer--file-system-adapter',
	'blocks-login-page--composite',
	'blocks-login-page--email-and-social',
	'blocks-login-page--custom-regions',
	'console-preferences--display-settings',
	'console-preferences--about',
	'console-preferences--theme-catalog',
	'console-integrated--resource-workspace',
]) {
	if (!storyIds.includes(requiredStory)) throw new Error(`Missing Storybook story: ${requiredStory}`);
}

console.log(`Pages check passed (${registry.items.length} registry items, ${storyIds.length} stories).`);

async function assertFile(relativePath) {
	try {
		await access(join(outputDir, relativePath));
	} catch {
		throw new Error(`Missing Pages artifact file: ${relativePath}`);
	}
}

function resolveJsonPointer(document, pointer) {
	let value = document;
	for (const encodedToken of pointer.slice(1).split('/')) {
		if (/~(?![01])/.test(encodedToken)) return undefined;
		const token = encodedToken.replaceAll('~1', '/').replaceAll('~0', '~');
		if ((typeof value !== 'object' && typeof value !== 'function') || value === null || !Object.hasOwn(value, token)) {
			return undefined;
		}
		value = value[token];
	}
	return value;
}
