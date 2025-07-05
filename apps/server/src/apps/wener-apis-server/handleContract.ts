import type { HttpBindings } from '@hono/node-server';
import { implement } from '@orpc/server';
import { getContext } from '@wener/nestjs';
import { WenerServerContract } from 'common/wener';
import type { Hono } from 'hono';
import { AlpinePackageMetaService } from '@/alpine/AlpinePackageMetaService';
import { AlpineRepoMetaService } from '@/alpine/AlpineRepoMetaService';
import { handleRPCContract } from './handleRPCContract';

const os = implement(WenerServerContract);

const router = os.router({
	version: os.version.handler(() => {
		return {
			version: '1.0.0',
		};
	}),

	alpine: {
		repo: {
			list: os.alpine.repo.list.handler(async ({ input }) => {
				const svc = getContext(AlpineRepoMetaService);
				let out = await svc.list(input.query);
				return out;
			}),
		},
		package: {
			list: os.alpine.package.list.handler(async ({ input }) => {
				const svc = getContext(AlpinePackageMetaService);
				const { data, total } = await svc.list(input.query);
				return {
					data,
					total,
				};
			}),
		},
	},
});

export function handleContract(app: Hono<{ Bindings: HttpBindings }>) {
	handleRPCContract(app, router);
}
