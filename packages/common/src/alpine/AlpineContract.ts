import { oc } from '@orpc/contract';
import { ListQuerySchema } from '@wener/common/resource';
import { z } from 'zod/v4';
import { ApkIndexPackageSchema } from './repo/parseApkIndex';

export type AlpinePackage = z.infer<typeof AlpinePackageSchema>;
export const AlpinePackageSchema = z.object({
	id: z.string(),

	path: z.string(),
	// directory: z.string(),
	filename: z.string(),

	branch: z.string(),
	channel: z.string(),

	...ApkIndexPackageSchema.shape,
});

export type AlpineRepo = z.infer<typeof AlpineRepoSchema>;
export const AlpineRepoSchema = z.object({
	id: z.string(),

	path: z.string(),
	branch: z.string(),
	channel: z.string(),
	arch: z.string(),

	version: z.string(),
});

/*
@Property({ type: types.string, generated: `branch || '/' || channel || '/' || arch`, unique: true })
	path!: string; // ${branch}/${channel}/${arch}

	@Property({ type: types.string })
	branch!: string;
	@Property({ type: types.string })
	channel!: string;
	@Property({ type: types.string })
	arch!: string;

	@Property({ type: types.string, nullable: true })
	description?: string;
	@Property({ type: types.string, default: '' })
	content!: string & Opt;
	@Property({ type: types.string })
	lastModifiedTime!: Date;
	@Property({ type: types.integer, default: 0 })
	size!: number & Opt;
 */

type ListResponse<T> = {
	data: T[];
	total: number;
};

export const AlpineContract = {
	// index: {
	// 	info: oc.output(z.object({})),
	// },
	repo: {
		list: oc
			.input(
				z.object({
					query: ListQuerySchema,
				}),
			)
			.output(
				z.object({
					data: AlpineRepoSchema.array(),
					total: z.number(),
				}),
			),
	},
	package: {
		list: oc
			.input(
				z.object({
					query: ListQuerySchema,
				}),
			)
			.output(
				z.object({
					data: AlpinePackageSchema.array(),
					total: z.number(),
				}),
			),
	},
};
