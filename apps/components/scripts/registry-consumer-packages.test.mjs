import assert from 'node:assert/strict';
import test from 'node:test';
import { packageNameFromSpec, validateLocalPackageDependency } from './registry-consumer-packages.mjs';

test('parses scoped and unscoped package selectors', () => {
	assert.equal(packageNameFromSpec('@wener/ai@^0.1.21'), '@wener/ai');
	assert.equal(packageNameFromSpec('@base-ui/react'), '@base-ui/react');
	assert.equal(packageNameFromSpec('zod@4.4.3'), 'zod');
	assert.equal(packageNameFromSpec('clsx'), 'clsx');
});

test('requires local package identity and every declared selector to match', () => {
	const dependency = validateLocalPackageDependency({
		manifest: { name: '@wener/ai', version: '0.1.21' },
		manifestPath: '/workspace/packages/wener-ai/package.json',
		name: '@wener/ai',
		path: '/workspace/packages/wener-ai',
		selectors: new Set(['@wener/ai@^0.1.21', '@wener/ai@0.1.21']),
	});
	assert.deepEqual(dependency, { path: '/workspace/packages/wener-ai', version: '0.1.21' });
	assert.throws(
		() =>
			validateLocalPackageDependency({
				manifest: { name: '@wener/other', version: '0.1.21' },
				manifestPath: '/workspace/packages/wener-ai/package.json',
				name: '@wener/ai',
				path: '/workspace/packages/wener-ai',
				selectors: new Set(['@wener/ai@^0.1.21']),
			}),
		/identity mismatch/,
	);
	assert.throws(
		() =>
			validateLocalPackageDependency({
				manifest: { name: '@wener/ai', version: '0.1.21' },
				manifestPath: '/workspace/packages/wener-ai/package.json',
				name: '@wener/ai',
				path: '/workspace/packages/wener-ai',
				selectors: new Set(['@wener/ai@^0.2.0']),
			}),
		/selector mismatch/,
	);
	assert.throws(
		() =>
			validateLocalPackageDependency({
				manifest: { name: '@wener/ai', version: '0.1.21' },
				manifestPath: '/workspace/packages/wener-ai/package.json',
				name: '@wener/ai',
				path: '/workspace/packages/wener-ai',
				selectors: new Set(['@wener/ai@~0.1.21']),
			}),
		/Unsupported local package selector/,
	);
});
