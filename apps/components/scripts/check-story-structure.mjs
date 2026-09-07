import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSync } from '@swc/core';

const appRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const storiesRoot = resolve(appRoot, process.env.WODE_STORIES_ROOT ?? 'src/stories');
const groups = {
	agent: { domain: 'agent', title: 'Agent/' },
	auth: { domain: 'auth', title: 'Auth/' },
	console: { domain: 'console', title: 'Console/' },
	'core/components': { domain: 'core', title: 'Core/Components/' },
	'core/ui': { domain: 'core', title: 'Core/UI/' },
	demo: { domain: 'demo', title: 'Demo/' },
	file: { domain: 'file', title: 'File/' },
	overview: { domain: 'overview', title: 'Overview/' },
	resource: { domain: 'resource', title: 'Resource/' },
	window: { domain: 'window', title: 'Window/' },
};
const allowedImports = {
	core: new Set(['core']),
	resource: new Set(['core', 'resource']),
	window: new Set(['core', 'window']),
	file: new Set(['core', 'window', 'file']),
	auth: new Set(['core', 'auth']),
	agent: new Set(['core', 'file', 'agent']),
	console: new Set(['core', 'resource', 'window', 'console']),
	overview: new Set(['core']),
	demo: new Set(['core', 'resource', 'window', 'file', 'agent', 'auth', 'console', 'demo']),
};
const componentSourceDomain = {
	agent: 'agent',
	auth: 'auth',
	components: 'core',
	console: 'console',
	file: 'file',
	resource: 'resource',
	ui: 'core',
	window: 'window',
};
const failures = [];
const sourceFiles = await listSourceFiles(storiesRoot);
const stories = sourceFiles.filter((file) => file.endsWith('.stories.ts') || file.endsWith('.stories.tsx'));

for (const file of stories) {
	const path = relative(storiesRoot, file);
	const group = groupFor(path);
	const source = await readFile(file, 'utf8');
	const meta = source.slice(source.indexOf('const meta = {'));
	const id = meta.match(/^const meta = \{\n\s*id: '([^']+)',/)?.[1];
	const title = meta.match(/title: '([^']+)',/)?.[1];
	if (!id) failures.push(`${path}: missing stable CSF id`);
	if (!title?.startsWith(group.title)) failures.push(`${path}: title must start with ${group.title}`);
	checkImports(file, path, group.domain, source);
}

for (const file of sourceFiles.filter((file) => !file.endsWith('.stories.ts') && !file.endsWith('.stories.tsx'))) {
	const path = relative(storiesRoot, file);
	const group = groupFor(path);
	const source = await readFile(file, 'utf8');
	checkImports(file, path, group.domain, source);
}

if (failures.length > 0) {
	console.error(`Story structure check failed:\n- ${failures.join('\n- ')}`);
	process.exitCode = 1;
} else {
	console.log(`Story structure check passed (${stories.length} CSF files, ${sourceFiles.length} Story source files).`);
}

function checkImports(file, path, domain, source) {
	for (const specifier of importedSpecifiers(source, file)) {
		if (specifier.startsWith('@components/') || specifier.startsWith('@ui/')) {
			failures.push(`${path}: Story source must not use registry aliases: ${specifier}`);
			continue;
		}
		const dependencyDomain = localImportDomain(file, specifier);
		if (!dependencyDomain) continue;
		if (!allowedImports[domain].has(dependencyDomain)) {
			failures.push(`${path}: ${domain} Story source imports forbidden ${dependencyDomain} source`);
		}
	}
}

function localImportDomain(file, specifier) {
	const resolvedPath = resolveLocalImport(file, specifier);
	if (!resolvedPath) return undefined;
	return componentImportDomain(resolvedPath) ?? storyImportDomain(resolvedPath);
}

function resolveLocalImport(file, specifier) {
	if (specifier.startsWith('@/stories/')) return resolve(storiesRoot, specifier.slice('@/stories/'.length));
	if (specifier.startsWith('@/')) return resolve(appRoot, 'src', specifier.slice('@/'.length));
	if (specifier.startsWith('#/')) return resolve(appRoot, 'src', specifier.slice('#/'.length));
	if (specifier.startsWith('/@fs/')) return resolve('/', decodeURIComponent(specifier.slice('/@fs/'.length)));
	if (specifier.startsWith('file:')) return fileURLToPath(specifier);
	if (specifier.startsWith('/')) return resolve(appRoot, specifier.slice('/'.length));
	if (specifier.startsWith('.')) return resolve(dirname(file), specifier);
	return undefined;
}

function componentImportDomain(resolvedPath) {
	const normalizedPath = relative(appRoot, resolvedPath).replaceAll('\\', '/');
	const match = normalizedPath.match(/^src\/(agent|auth|components|console|file|resource|ui|window)(?:\/|$)/);
	return match ? componentSourceDomain[match[1]] : undefined;
}

function storyImportDomain(resolvedPath) {
	const normalizedPath = relative(storiesRoot, resolvedPath).replaceAll('\\', '/');
	return Object.entries(groups).find(([prefix]) => normalizedPath.startsWith(`${prefix}/`))?.[1].domain;
}

function importedSpecifiers(source, file) {
	const specifiers = new Set();
	try {
		const module = parseSync(source, {
			syntax: 'typescript',
			tsx: file.endsWith('.tsx'),
			target: 'es2022',
		});
		visit(module);
	} catch (error) {
		failures.push(`${relative(storiesRoot, file)}: invalid TypeScript syntax: ${error.message}`);
	}
	return specifiers;

	function visit(node) {
		if (!node || typeof node !== 'object') return;
		if (
			node.type === 'ImportDeclaration' ||
			node.type === 'ExportNamedDeclaration' ||
			node.type === 'ExportAllDeclaration'
		)
			addStaticModuleSpecifier(node.source);
		if (node.type === 'CallExpression' && node.callee?.type === 'Import') {
			const specifier = node.arguments?.[0]?.expression;
			if (!addStaticModuleSpecifier(specifier))
				failures.push(`${relative(storiesRoot, file)}: Story dynamic import must use a static string`);
		}
		if (node.type === 'TsImportType') addStaticModuleSpecifier(node.argument);
		if (node.type === 'TsImportEqualsDeclaration' && node.moduleRef?.type === 'TsExternalModuleReference')
			addStaticModuleSpecifier(node.moduleRef.expression);
		for (const value of Object.values(node)) {
			if (Array.isArray(value)) value.forEach(visit);
			else visit(value);
		}
	}

	function addStaticModuleSpecifier(node) {
		const specifier = staticModuleSpecifier(node);
		if (specifier === undefined) return false;
		specifiers.add(specifier);
		return true;
	}

	function staticModuleSpecifier(node) {
		if (node?.type === 'StringLiteral') return node.value;
		if (node?.type === 'TemplateLiteral' && node.expressions.length === 0)
			return node.quasis.map((quasi) => quasi.cooked).join('');
		if (node?.type === 'TsAsExpression' || node?.type === 'TsTypeAssertion')
			return staticModuleSpecifier(node.expression);
		return undefined;
	}
}

async function listSourceFiles(directory) {
	const files = [];
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) files.push(...(await listSourceFiles(path)));
		else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) files.push(path);
	}
	return files;
}

function groupFor(path) {
	for (const [prefix, group] of Object.entries(groups)) {
		if (path.startsWith(`${prefix}/`)) return group;
	}
	throw new Error(`Story is outside the approved taxonomy: ${path}`);
}
