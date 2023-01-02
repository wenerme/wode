import { z, ZodObject, ZodType } from 'zod';
import { ZodRawShape, ZodTypeAny } from 'zod/lib/types';
import { arrayOfMaybeArray, MaybeArray } from '@wener/utils';
import { Order, parseOrder } from './parseOrder';

export interface PageResponse<T = any> {
  items: Array<T>;
  total: number;
  cursor?: string;
}

export const PageRequestInput = z.object({
  pageSize: z
    .preprocess((arg: any) => parseInt(arg), z.number().min(0))
    .optional()
    .describe('每页大小'),
  pageIndex: z
    .preprocess((arg: any) => parseInt(arg), z.number().min(0))
    .optional()
    .describe('页码 - 0 开始'),
  pageNumber: z
    .preprocess((arg: any) => parseInt(arg), z.number().min(1))
    .optional()
    .describe('页号 - 1 开始'),
  limit: z.preprocess((arg: any) => parseInt(arg), z.number().min(1).default(50)).optional(),
  offset: z.preprocess((arg: any) => parseInt(arg), z.number().min(0)).optional(),
  search: z.string().trim().optional().describe('搜索'),
  filter: z.string().trim().optional().describe('筛选'),
  // trpc-openapi 不能配置为 array
  order: z
    .string()
    .trim()
    // .or(z.array(z.string()))
    // .regex(/^([a-z0-9_](\s+(asc|desc))?)(','([a-z0-9_](\s+(asc|desc))?))*$/i)
    .optional()
    .describe('排序;格式: field [asc|desc],[...]'),
  cursor: z.string().trim().optional().describe('分页游标'),
  deleted: z
    .preprocess((arg: any) => parseInt(arg), z.boolean())
    .optional()
    .describe('是否包含已删除'),
});

export const PageRequest = PageRequestInput.transform(normalizePageRequest);

export function normalizePageRequest<T extends z.infer<typeof PageRequestInput>>({ order, ...input }: T) {
  if (input.pageSize) {
    input.limit = input.pageSize;
  }
  if (input.pageNumber) {
    input.pageIndex = input.pageNumber - 1;
  }
  if (input.pageIndex) {
    input.offset = input.pageIndex * (input.limit || 50);
  }
  let o: Order = [];
  if (order) {
    o = parseOrder(order);
  }
  return { ...input, order: o };
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type PageRequest = z.infer<typeof PageRequest>;

export function createPageResponseSchema<T extends ZodTypeAny>(o: T) {
  return z.object({
    items: z.array(o),
    total: z.number(),
    cursor: z.string().nullish(),
  });
}
