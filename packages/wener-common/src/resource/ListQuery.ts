import { z } from 'zod/v4';

export type ListQueryInput = z.input<typeof ListQuerySchema>;
export type ListQuery = z.infer<typeof ListQuerySchema>;
const IntLikeSchema = z.coerce
	.number()
	.multipleOf(1)
	.min(0)
	.optional()
	.overwrite((v) => v || undefined);
export const ListQuerySchema = z.object({
	id: z.coerce.string().optional(),
	ids: z.array(z.coerce.string()).optional(),
	filter: z.string().optional().describe('sql-like filter string'),
	filters: z.array(z.any()).optional().describe('sql-like filter string'),
	where: z.any().optional().describe('document query filter'),
	search: z.string().optional(),
	limit: IntLikeSchema,
	offset: IntLikeSchema,
	order: z.array(z.string()).optional().describe('order like "a,-b,c desc null last"'),
	pageIndex: IntLikeSchema.describe('0-based page index'),
	pageNumber: IntLikeSchema.describe('1-based page number'),
	pageSize: IntLikeSchema,
	cursor: z.string().optional(),
	deleted: z.coerce.boolean().optional(),
});

type ListQueryOverride = ListQueryInput | undefined | ((input: ListQueryInput) => ListQueryInput | undefined | void);

export function resolveListQuery(target: ListQueryInput | undefined, ...args: ListQueryOverride[]): ListQuery {
	let out = args.reduce((a: ListQueryInput, source) => {
		if (typeof source === 'function') {
			const result = source(a);
			// do not use the result as merge source
			return result || a;
		}

		let b: ListQueryInput | undefined = source;
		if (!b) return a;

		// do not resolve id to ids
		let ids = [...(a.ids || []), ...(b.ids || [])];
		return {
			...a,
			...b,
			ids: ids,
			filters: [...(a.filters || []), ...(b.filters || [])],
			search: b.search || a.search,
			// NOTE maybe should merge where ?
		};
	}, target || {});
	return ListQuerySchema.parse(out);
}
