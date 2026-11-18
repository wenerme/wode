// Generated from larksuite/cli internal/registry/meta_data.json @ b2b43630c560b00b5634e5614826801a94e1ae40 (MIT License, Copyright (c) 2026 Lark Technologies Pte. Ltd.). Do not edit.
// Regenerate: FEISHU_OPENAPI_META=<meta_data.json> FEISHU_OPENAPI_COMMIT=<sha> node --import tsx packages/wener-client/scripts/generate-feishu-openapi.ts
import { z } from 'zod';
import type { FeishuApiSchemas } from '../types';

export const FeishuApiApproval = {
	'approval.instances.cancel': {
		body: z.looseObject({
			instance_code: z.string().describe('审批实例 Code'),
		}),
	},
	'approval.instances.cc': {
		query: z.looseObject({
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户ID的类型').optional(),
		}),
		body: z.looseObject({
			cc_user_ids: z.array(z.unknown()).describe('抄送人的用户 ID 列表'),
			comment: z.string().describe('抄送留言').optional(),
			instance_code: z.string().describe('审批实例 Code'),
		}),
	},
	'approval.instances.get': {
		query: z.looseObject({
			instance_code: z.string().describe('审批实例 Code'),
			locale: z.enum(['zh-CN', 'en-US', 'ja-JP', 'zh-HK', 'zh-TW', 'de-DE', 'es-ES', 'fr-FR', 'id-ID', 'it-IT', 'ko-KR', 'pt-BR', 'th-TH', 'vi-VN', 'ms-MY', 'ru-RU']).describe('语言').optional(),
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户ID的类型').optional(),
		}),
		response: z.looseObject({
			comments: z.array(z.looseObject({
				comment: z.string().describe('评论内容').optional(),
				create_time: z.string().describe('评论时间').optional(),
				files: z.array(z.looseObject({
					file_size: z.number().int().describe('附件大小').optional(),
					title: z.string().describe('附件标题').optional(),
					type: z.string().describe('附件类别').optional(),
					url: z.string().describe('附件路径').optional(),
				})).describe('评论附件').optional(),
				id: z.string().describe('评论 id').optional(),
				user_id: z.string().describe('发表评论用户').optional(),
			})).describe('评论列表').optional(),
			current_nodes: z.array(z.looseObject({
				approvers: z.array(z.looseObject({
					task_id: z.string().describe('任务ID').optional(),
					user_id: z.string().describe('任务对应的userID').optional(),
				})).describe('当前节点审批人').optional(),
				node_id: z.string().describe('当前审批节点 id').optional(),
				node_name: z.string().describe('当前审批节点名称').optional(),
				type: z.string().describe('审批方式').optional(),
			})).describe('当前审批节点').optional(),
			definition_code: z.string().describe('审批定义 Code').optional(),
			definition_name: z.string().describe('审批名称').optional(),
			department_id: z.string().describe('发起审批用户所在部门').optional(),
			end_time: z.string().describe('审批完成时间，未完成为 0').optional(),
			form: z.string().describe('json字符串，控件值').optional(),
			instance_code: z.string().describe('审批实例 Code').optional(),
			operation_records: z.array(z.looseObject({
				cc_user_ids: z.array(z.unknown()).describe('被抄送人列表').optional(),
				comment: z.string().describe('理由').optional(),
				create_time: z.string().describe('发生时间').optional(),
				files: z.array(z.looseObject({
					file_size: z.number().int().describe('附件大小').optional(),
					title: z.string().describe('附件标题').optional(),
					type: z.string().describe('附件类别').optional(),
					url: z.string().describe('附件路径').optional(),
				})).describe('审批附件').optional(),
				node_id: z.string().describe('产生task的节点key').optional(),
				task_id: z.string().describe('产生动态关联的task_id').optional(),
				type: z.string().describe('事件类型').optional(),
				user_id: z.string().describe('动态产生用户').optional(),
			})).describe('审批动态').optional(),
			reverted: z.boolean().describe('单据是否被撤销').optional(),
			serial_number: z.string().describe('审批单编号').optional(),
			start_time: z.string().describe('审批创建时间').optional(),
			status: z.string().describe('审批实例状态').optional(),
			tasks: z.array(z.looseObject({
				end_time: z.string().describe('task 完成时间, 未完成为 0').optional(),
				id: z.string().describe('审批任务id').optional(),
				node_id: z.string().describe('task 所属节点 id').optional(),
				node_name: z.string().describe('task 所属节点名称').optional(),
				start_time: z.string().describe('task 开始时间').optional(),
				status: z.string().describe('instance 状态').optional(),
				type: z.string().describe('审批方式').optional(),
				user_id: z.string().describe('审批人的用户id，自动通过、自动拒绝 时为空').optional(),
			})).describe('审批任务列表').optional(),
			user_id: z.string().describe('发起审批用户').optional(),
		}),
	},
	'approval.instances.initiated': {
		query: z.looseObject({
			definition_code: z.string().describe('审批定义 Code').optional(),
			locale: z.enum(['zh-CN', 'en-US', 'ja-JP']).describe('语言').optional(),
			page_size: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('分页大小').optional(),
			page_token: z.string().describe('分页标记，第一次请求不填，表示从头开始遍历').optional(),
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户ID的类型').optional(),
		}),
		response: z.looseObject({
			count: z.number().int().describe('列表计数，只在分页第一页返回，大于等于 100 个任务时将返回 99').optional(),
			has_more: z.boolean().describe('是否有更多任务可供拉取').optional(),
			instances: z.array(z.looseObject({
				definition_code: z.string().describe('审批定义 Code').optional(),
				definition_group_id: z.string().describe('审批定义分组 ID').optional(),
				definition_group_name: z.string().describe('审批定义分组名称').optional(),
				definition_name: z.string().describe('审批定义名称').optional(),
				initiator: z.string().describe('发起人 ID').optional(),
				initiator_name: z.string().describe('发起人姓名').optional(),
				instance_code: z.string().describe('审批实例 Code').optional(),
				instance_external_id: z.string().describe('三方审批实例 ID，仅第三方审批实例存在该字段，需要在当前租户、当前 APP 内唯一').optional(),
				instance_status: z.string().describe('审批实例状态').optional(),
				link: z.string().describe('三方审批跳转链接，用于跳转回三方审批系统查看单据详情').optional(),
				summaries: z.array(z.looseObject({
					key: z.string().describe('字段key').optional(),
					value: z.string().describe('字段value').optional(),
				})).describe('摘要').optional(),
			})).describe('任务列表').optional(),
			page_token: z.string().describe('翻页 Token').optional(),
		}),
	},
	'approval.tasks.add_sign': {
		query: z.looseObject({
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户ID的类型').optional(),
		}),
		body: z.looseObject({
			add_sign_type: z.union([z.literal(1), z.literal(2), z.literal(3)]).describe('1/2/3分别代表前加签/后加签/并加签'),
			add_sign_user_ids: z.array(z.unknown()).describe('被加签人id'),
			approval_method: z.union([z.literal(1), z.literal(2), z.literal(3)]).describe('仅在前加签、后加签时需要填写，1/2 分别代表或签/会签').optional(),
			comment: z.string().describe('审批意见').optional(),
			instance_code: z.string().describe('审批实例code'),
			task_id: z.string().describe('任务id'),
		}),
	},
	'approval.tasks.approve': {
		body: z.looseObject({
			comment: z.string().describe('审批意见').optional(),
			form: z.string().describe('表单数据').optional(),
			instance_code: z.string().describe('审批实例 Code'),
			task_id: z.string().describe('审批任务 ID'),
		}),
	},
	'approval.tasks.query': {
		query: z.looseObject({
			definition_code: z.string().describe('审批定义 Code').optional(),
			locale: z.enum(['zh-CN', 'en-US', 'ja-JP']).describe('语言').optional(),
			page_size: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('分页大小').optional(),
			page_token: z.string().describe('分页标记，第一次请求不填，表示从头开始遍历').optional(),
			topic: z.enum(['1', '2', '3', '17', '18']).describe('需要查询的任务分组主题，如「待办」、「已办」等'),
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户ID的类型').optional(),
		}),
		response: z.looseObject({
			count: z.number().int().describe('列表计数，只在分页第一页返回，大于等于 100 个任务时将返回 99').optional(),
			has_more: z.boolean().describe('是否有更多任务可供拉取').optional(),
			page_token: z.string().describe('翻页 Token').optional(),
			tasks: z.array(z.looseObject({
				definition_code: z.string().describe('审批定义 Code').optional(),
				definition_group_id: z.string().describe('审批定义分组 ID').optional(),
				definition_group_name: z.string().describe('审批定义分组名称').optional(),
				definition_name: z.string().describe('审批定义名称').optional(),
				initiator: z.string().describe('发起人 ID').optional(),
				initiator_name: z.string().describe('发起人姓名').optional(),
				instance_code: z.string().describe('审批实例 Code').optional(),
				instance_external_id: z.string().describe('三方审批实例 ID，仅第三方审批实例存在该字段，需要在当前租户、当前 APP 内唯一').optional(),
				instance_status: z.string().describe('审批实例状态').optional(),
				link: z.string().describe('三方审批跳转链接，用于跳转回三方审批系统查看单据详情').optional(),
				status: z.string().describe('任务状态').optional(),
				summaries: z.array(z.looseObject({
					key: z.string().describe('字段key').optional(),
					value: z.string().describe('字段value').optional(),
				})).describe('摘要').optional(),
				support_api_operate: z.boolean().describe('是否支持通过api接口同意或拒绝任务').optional(),
				task_external_id: z.string().describe('三方任务 ID，仅第三方审批任务存在该字段，需要在当前审批实例内唯一').optional(),
				task_id: z.string().describe('任务 ID，全局唯一').optional(),
				title: z.string().describe('任务题目').optional(),
				topic: z.string().describe('任务所属的任务分组，如「待办」、「已办」等').optional(),
				user_id: z.string().describe('任务所属的用户 ID').optional(),
			})).describe('任务列表').optional(),
		}),
	},
	'approval.tasks.reject': {
		body: z.looseObject({
			comment: z.string().describe('审批意见').optional(),
			instance_code: z.string().describe('审批实例 Code'),
			task_id: z.string().describe('审批任务 ID'),
		}),
	},
	'approval.tasks.remind': {
		body: z.looseObject({
			comment: z.string().describe('评论').optional(),
			instance_code: z.string().describe('审批实例 Code'),
			task_ids: z.array(z.unknown()).describe('被催办的任务ID'),
		}),
	},
	'approval.tasks.rollback': {
		body: z.looseObject({
			comment: z.string().describe('审批意见').optional(),
			instance_code: z.string().describe('审批实例code'),
			node_ids: z.array(z.unknown()).describe('节点id'),
			task_id: z.string().describe('任务id'),
		}),
	},
	'approval.tasks.transfer': {
		query: z.looseObject({
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户ID的类型').optional(),
		}),
		body: z.looseObject({
			comment: z.string().describe('审批意见').optional(),
			instance_code: z.string().describe('审批实例 Code'),
			task_id: z.string().describe('审批任务 ID'),
			transfer_user_id: z.string().describe('被转交人的用户 ID'),
		}),
	},
} satisfies Record<string, FeishuApiSchemas>;
