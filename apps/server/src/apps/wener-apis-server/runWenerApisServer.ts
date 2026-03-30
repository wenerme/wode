import process from 'node:process';
import type { HttpBindings } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { DataloaderType } from '@mikro-orm/core';
import { Module } from '@nestjs/common';
import { formatLogObject } from '@wener/common/consola';
import { createBootstrap } from '@wener/server';
import { runServer } from '@wener/server/hono';
import { OrmModule } from '@wener/server/mikro-orm';
import { Errors, parseBoolean } from '@wener/utils';
import consola from 'consola';
import { LogLevels } from 'consola/core';
import { pick } from 'es-toolkit';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { getWenerApisDynamicModule } from '@/apps/wener-apis-server/const';
import { DefaultMikroORMConfig } from '@/apps/wener-apis-server/DefaultMikroORMConfig';
import { handleContract } from '@/apps/wener-apis-server/handleContract';
import { EntityEventRelaySubscriber } from '@/server/events/EntityEventRelaySubscriber';
import { createHonoAuth } from '@/server/hono/createHonoAuth';
import { createHonoContext } from '@/server/hono/createHonoContext';
import { getDatabaseUrl } from '@/utils/getDatabaseUrl';

const InstanceModule = getWenerApisDynamicModule();
consola.setReporters([
	{
		log: (o, ctx) => {
			console.log(formatLogObject(o, ctx));
		},
	},
]);

export async function runWenerApisServer() {
	const log = consola.withTag(runWenerApisServer.name);
	log.info(`starting server log=${Object.entries(LogLevels).find((v) => v[1] === log.level)?.[0] || log.level}`);

	const bootstrap = createBootstrap({
		module: WenerApisServerModule,
	});

	await bootstrap();

	type Bindings = HttpBindings & {};
	const app = new Hono<{ Bindings: Bindings }>();
	app.use(logger());
	const withContext = createHonoContext();
	const withAuth = createHonoAuth({
		log,
		allowBasicAuth: (c) => {
			return c.req.path.startsWith('/webdav');
		},
	});
	app.use(withContext);

	app.get('/api/ready', (c) => c.json({ ok: true }));
	app.get('/api/live', (c) => c.json({ ok: true }));

	app.onError((err, c) => {
		process.env.NODE_ENV === 'development' && console.error(err);
		return Errors.resolve(err).asResponse();
	});

	handleContract(app);

	app.use('/docs.html', serveStatic({ root: './public' }));
	app.use('/graphiql.html', serveStatic({ root: './public' }));

	{
		const { request } = await import('undici');

		app.on(['GET'], ['/', '/:path{.*}'], async (c) => {
			// github pages
			// 185.199.108.153
			const target = '185.199.108.153';
			let next = `http://${target}/${c.req.param('path') || ''}`;
			let headers: Record<string, any> = {
				...pick(c.req.header(), ['accept-encoding']),
				Host: 'wener.me',
			};

			// fetch can not override the host header
			let res = await request(next, {
				headers,
			});

			return new Response(res.body as any, {
				status: res.statusCode,
				headers: new Headers(Object.entries(res.headers) as any),
			});
		});
	}

	// app.doc('/api/openapi.json', { openapi: '3.0.0', info: { version: '1.0.0', title: 'API' } });

	await runServer({ app, env: false });
}

@Module({
	imports: [
		OrmModule.forRootAsync({
			useFactory: async () => {
				const { MikroORM, defineConfig } = await import('@mikro-orm/postgresql');
				return defineConfig({
					...DefaultMikroORMConfig,
					clientUrl: getDatabaseUrl(),
					entities: [...InstanceModule.entities],
					dataloader: DataloaderType.ALL,
					// debug: isDev,
					debug: parseBoolean(process.env.DB_DEBUG),
					subscribers: [EntityEventRelaySubscriber.getInstance()],

					// extensions: [Migrator],
					// migrations: {
					// 	generator: CustomMigrationGenerator,
					// 	migrationsList: getMikroOrmMigrations(),
					// },
				});
			},
		}),
		InstanceModule.module,
	],
})
class WenerApisServerModule {}
