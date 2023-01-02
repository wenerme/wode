/* eslint-disable @typescript-eslint/no-redeclare */
import { z } from 'zod';

export const MinimalModelSchema = z.object({
  id: z.string().describe('ID'),
  createdAt: z.date().or(z.string()).describe('创建时间'),
  updatedAt: z.date().or(z.string()).describe('更新时间'),
  deletedAt: z.date().or(z.string()).nullish().describe('删除时间'),
});

export const BaseModelSchema = MinimalModelSchema.extend({
  uid: z.string().describe('唯一 UUID'),
  // sid: z.number().or(z.string()).describe('自增 ID'), // 目前基础设施没有提供自增 ID
  eid: z.string().nullish().describe('外部 ID'),
});
export const TenantBaseModelSchema = BaseModelSchema.extend({
  tid: z.string().describe('租户ID'),
});

export type MinimalModelSchema = z.infer<typeof MinimalModelSchema>;
export type BaseModelSchema = z.infer<typeof BaseModelSchema>;
export type TenantBaseModelSchema = z.infer<typeof TenantBaseModelSchema>;
