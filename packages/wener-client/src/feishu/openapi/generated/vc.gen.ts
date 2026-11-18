// Generated from larksuite/cli internal/registry/meta_data.json @ b2b43630c560b00b5634e5614826801a94e1ae40 (MIT License, Copyright (c) 2026 Lark Technologies Pte. Ltd.). Do not edit.
// Regenerate: FEISHU_OPENAPI_META=<meta_data.json> FEISHU_OPENAPI_COMMIT=<sha> node --import tsx packages/wener-client/scripts/generate-feishu-openapi.ts
import { z } from 'zod';
import type { FeishuApiSchemas } from '../types';

export const FeishuApiVc = {
	'vc.meeting.get': {
		pathParams: z.strictObject({
			meeting_id: z.union([z.string(), z.number().transform(String)]).describe('会议ID（视频会议的唯一标识，视频会议开始后才会产生）'),
		}),
		query: z.looseObject({
			query_mode: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().pipe(z.union([z.literal(0), z.literal(1)]))).describe('此次查询的查询模式，不传，或传0，只查询会议信息').optional(),
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户ID的类型，默认使用open_id可不填').optional(),
			with_meeting_ability: z.union([z.boolean(), z.stringbool()]).describe('是否需要会中使用能力统计（仅限tenant_access_token）').optional(),
			with_participants: z.union([z.boolean(), z.stringbool()]).describe('是否需要参会人列表').optional(),
		}),
		response: z.looseObject({
			meeting: z.looseObject({
				ability: z.looseObject({
					use_audio: z.boolean().describe('是否使用音频').optional(),
					use_follow_screen: z.boolean().describe('是否使用妙享（magic share）').optional(),
					use_pstn: z.boolean().describe('是否使用PSTN').optional(),
					use_recording: z.boolean().describe('是否使用录制').optional(),
					use_share_screen: z.boolean().describe('是否使用共享屏幕').optional(),
					use_video: z.boolean().describe('是否使用视频').optional(),
				}).describe('会中使用的能力').optional(),
				create_time: z.string().describe('会议创建时间（unix时间，单位sec）').optional(),
				end_time: z.string().describe('会议结束时间（unix时间，单位sec）').optional(),
				host_user: z.looseObject({
					id: z.string().describe('用户ID').optional(),
					user_type: z.number().int().describe('用户类型').optional(),
				}).describe('主持人').optional(),
				id: z.string().describe('会议ID（视频会议的唯一标识，视频会议开始后才会产生）').optional(),
				meeting_connect: z.boolean().describe('该会议是否支持互通（注：该字段内测中）').optional(),
				meeting_no: z.string().describe('会议号').optional(),
				note_id: z.string().describe('会议纪要 ID，可用于调用 note detail API 获取纪要详情（query_mode=0 时返回）').optional(),
				participant_count: z.string().describe('参会峰值人数').optional(),
				participant_count_accumulated: z.string().describe('累计参会人数').optional(),
				participants: z.array(z.looseObject({
					final_leave_time: z.string().describe('最终离会时间，秒级Unix时间戳').optional(),
					first_join_time: z.string().describe('首次入会时间，秒级Unix时间戳').optional(),
					id: z.string().describe('用户ID').optional(),
					in_meeting_duration: z.string().describe('累计在会中时间，时间单位：秒').optional(),
					is_cohost: z.boolean().describe('是否为联席主持人').optional(),
					is_external: z.boolean().describe('是否为外部参会人').optional(),
					is_host: z.boolean().describe('是否为主持人').optional(),
					status: z.number().int().describe('参会人状态').optional(),
					user_type: z.number().int().describe('用户类型').optional(),
				})).describe('参会人列表').optional(),
				password: z.string().describe('会议密码').optional(),
				start_time: z.string().describe('会议开始时间（unix时间，单位sec）').optional(),
				status: z.number().int().describe('会议状态').optional(),
				topic: z.string().describe('会议主题').optional(),
				url: z.string().describe('会议链接（飞书用户可通过点击会议链接快捷入会）').optional(),
			}).describe('会议数据').optional(),
			related_artifacts: z.looseObject({
				note_doc_token: z.string().describe('智能纪要的 doc_token;- 文档一旦生成，就可以查到对应 token;- 无字段权限时，该 key 不会出现在 related_artifacts 结构当中;- 有字段权限而无内容时，related_artifacts 结构中会包…').optional(),
				verbatim_doc_token: z.string().describe('逐字稿的 doc_token;- 文档一旦生成，就可以查到对应 token;- 无字段权限时，该 key 不会出现在 related_artifacts 结构当中;- 有字段权限而无内容时，related_artifacts 结构中会包含…').optional(),
			}).optional(),
		}),
	},
} satisfies Record<string, FeishuApiSchemas>;
