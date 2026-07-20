#!/usr/bin/env node
import consola from 'consola';
import { createProgram } from './cli';

const log = consola.withTag('mcps');

const program = createProgram({
	setup: async (ctx) => {
		const { setupAudit } = await import('./audit/server/plugin.js');
		setupAudit(ctx);
	},
});

program.parseAsync(process.argv).catch((error) => {
	log.error(error.message);
	process.exit(1);
});
