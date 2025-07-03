import type { HttpBindings } from '@hono/node-server';
import { implement } from '@orpc/server';
import { getContext } from '@wener/nestjs';
import { WenerServerContract } from 'common/wener';
import type { Hono } from 'hono';
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
			list: os.alpine.repo.list.handler(async () => {
				const svc = getContext(AlpineRepoMetaService);
				let out = await svc.list({});
				return out;
			}),
		},
	},
});

export function handleContract(app: Hono<{ Bindings: HttpBindings }>) {
	handleRPCContract(app, router);
}
