// Generated from larksuite/cli internal/registry/meta_data.json @ b2b43630c560b00b5634e5614826801a94e1ae40 (MIT License, Copyright (c) 2026 Lark Technologies Pte. Ltd.). Do not edit.
// Regenerate: FEISHU_OPENAPI_META=<meta_data.json> FEISHU_OPENAPI_COMMIT=<sha> node --import tsx packages/wener-client/scripts/generate-feishu-openapi.ts
import { z } from 'zod';
import type { FeishuApiSchemas } from '../types';

export const FeishuApiMinutes = {
	'minutes.minutes.get': {
		pathParams: z.strictObject({
			minute_token: z.union([z.string(), z.number().transform(String)]).describe('妙记唯一标识'),
		}),
		query: z.looseObject({
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户ID的类型').optional(),
		}),
		response: z.looseObject({
			minute: z.looseObject({
				cover: z.string().describe('妙记封面链接').optional(),
				create_time: z.string().describe('妙记创建时间timestamp（ms级别）').optional(),
				duration: z.string().describe('妙记时长（ms级别）').optional(),
				owner_id: z.string().describe('所有者ID').optional(),
				title: z.string().describe('妙记标题').optional(),
				token: z.string().describe('妙记token').optional(),
				url: z.string().describe('妙记链接').optional(),
			}).describe('妙记基本信息').optional(),
		}),
	},
} satisfies Record<string, FeishuApiSchemas>;
