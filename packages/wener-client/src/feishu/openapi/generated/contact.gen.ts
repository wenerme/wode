// Generated from larksuite/cli internal/registry/meta_data.json @ b2b43630c560b00b5634e5614826801a94e1ae40 (MIT License, Copyright (c) 2026 Lark Technologies Pte. Ltd.). Do not edit.
// Regenerate: FEISHU_OPENAPI_META=<meta_data.json> FEISHU_OPENAPI_COMMIT=<sha> node --import tsx packages/wener-client/scripts/generate-feishu-openapi.ts
import { z } from 'zod';
import type { FeishuApiSchemas } from '../types';

export const FeishuApiContact = {
	'contact.user_profiles.batch_query': {
		query: z.looseObject({
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('用户id类型 open_id/user_id/union_id').optional(),
		}),
		body: z.looseObject({
			query_option: z.looseObject({
				include_description: z.boolean().describe('是否返回 description').optional(),
				include_personal_status: z.boolean().describe('是否返回 personal_status').optional(),
			}).describe('控制返回字段').optional(),
			user_ids: z.array(z.unknown()).describe('用户列表'),
		}),
		response: z.looseObject({
			user_profiles: z.array(z.looseObject({
				description: z.looseObject({
					default_locale: z.string().describe('默认语种，例如 zh_cn / ja_jp / en_us').optional(),
					default_value: z.string().describe('默认值').optional(),
					i18n_value: z.record(z.string(), z.unknown()).describe('国际化签名').optional(),
				}).describe('个性签名，当请求参数 include_description=true 时返回').optional(),
				personal_status: z.looseObject({
					effective_interval: z.record(z.string(), z.unknown()).describe('生效区间（当前时间命中该区间表示状态处于生效中）').optional(),
					i18n_title: z.record(z.string(), z.unknown()).describe('国际化名称，长度 1-40（按 rune 计）').optional(),
					icon_key: z.string().describe('状态图标标识').optional(),
					is_not_disturb_mode: z.boolean().describe('状态生效时是否联动开启勿扰模式').optional(),
					personal_status_id: z.string().describe('个人状态 ID').optional(),
					title: z.string().describe('个人状态名称，长度 1-40（按 rune 计）').optional(),
				}).describe('个人状态，当请求参数 include_personal_status=true 时返回').optional(),
				user_id: z.string().describe('用户id').optional(),
			})).describe('个人信息列表').optional(),
		}),
	},
} satisfies Record<string, FeishuApiSchemas>;
