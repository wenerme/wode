import { serve } from '@hono/node-server';
import consola from 'consola';
import { createServer, type CreateServerOptions } from './server/server';

const log = consola.withTag('mcps');

let serverHandle: ReturnType<typeof serve> | undefined;
let isShuttingDown = false;

async function shutdown() {
	if (isShuttingDown) {
		log.warn('Force exit');
		process.exit(1);
	}
	isShuttingDown = true;
	log.info('Shutting down...');

	const forceTimer = setTimeout(() => process.exit(1), 3000);
	forceTimer.unref();

	try {
		const { closeDb, isDbInitialized } = await import('./audit/server/db.js');
		if (isDbInitialized()) {
			await closeDb();
		}
	} catch {}

	if (serverHandle) {
		serverHandle.close(() => process.exit(0));
	} else {
		process.exit(0);
	}
}

process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());

export async function startServer(options: { port: string; cwd: string; discoveryConfig: boolean; setup?: CreateServerOptions['setup'] }) {
	const port = Number.parseInt(options.port, 10);
	const { app, printEndpoints, finalize } = createServer({
		cwd: options.cwd,
		port,
		discoveryConfig: options.discoveryConfig,
		setup: options.setup,
	});

	await finalize();

	log.info(`Starting MCPS server on port ${port}`);

	serverHandle = serve({
		fetch: app.fetch,
		port,
		hostname: '0.0.0.0',
	});

	log.success(`MCPS server running at http://localhost:${port}`);
	printEndpoints();
}
