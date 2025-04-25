import process from 'node:process';
import type { HttpBindings } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Module } from '@nestjs/common';
import { runServer } from '@wener/nestjs/hono';
import { Errors } from '@wener/utils';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { handleContract } from '@/apps/lab-server/handleContract';

export async function runLabServer() {
	type Bindings = HttpBindings & {};
	const app = new Hono<{ Bindings: Bindings }>();
	app.use(logger());

	app.get('/api/ready', (c) => c.json({ ok: true }));
	app.get('/api/live', (c) => c.json({ ok: true }));

	app.onError((err, c) => {
		process.env.NODE_ENV === 'development' && console.error(err);
		return Errors.resolve(err).asResponse();
	});

	handleContract(app);

	// app.doc('/api/openapi.json', { openapi: '3.0.0', info: { version: '1.0.0', title: 'API' } });
	app.use('*', serveStatic({ root: './public' }));

	await runServer({ app, env: false });
}

@Module({})
class LabServerModule {}
