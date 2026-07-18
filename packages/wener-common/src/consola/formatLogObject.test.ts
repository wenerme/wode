import consola from 'consola';
import { Consola, type ConsolaInstance } from 'consola/core';
import { test } from 'vite-plus/test';
import { createStandardConsolaReporter } from './createStandardConsolaReporter';

test('formatLogObject', async () => {
	const log: ConsolaInstance = new Consola({
		reporters: [createStandardConsolaReporter({})],
	}).create({
		formatOptions: {
			colors: true,
		},
	});
	consola.warn({ name: 'wener' });

	log.info({ name: 'wener' });
	log.info('message', {
		name: 'wener',
	});
	log.info('complex object', {
		name: 'wener',
		age: 30,
		active: true,
		tags: ['developer', 'typescript'],
		meta: { level: 'senior', remote: true },
	});
});
