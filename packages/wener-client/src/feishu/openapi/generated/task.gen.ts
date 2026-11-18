// Generated from larksuite/cli internal/registry/meta_data.json @ b2b43630c560b00b5634e5614826801a94e1ae40 (MIT License, Copyright (c) 2026 Lark Technologies Pte. Ltd.). Do not edit.
// Regenerate: FEISHU_OPENAPI_META=<meta_data.json> FEISHU_OPENAPI_COMMIT=<sha> node --import tsx packages/wener-client/scripts/generate-feishu-openapi.ts
import { z } from 'zod';
import type { FeishuApiSchemas } from '../types';

export const FeishuApiTask = {
	'task.agent.register_agent': {
		response: z.looseObject({
			agent: z.looseObject({
				app_id: z.string().describe('应用唯一标识，用于区分不同应用主体').optional(),
				app_name: z.string().describe('应用名称，用于展示应用的友好标识，支持中英文混合').optional(),
			}).describe('AI智能体的核心信息对象，包含智能体所属应用的唯一标识与友好名称，用于标识和展示已注册的智能体主体').optional(),
		}),
	},
	'task.agent.update_agent_profile': {
		body: z.looseObject({
			profile_content: z.string().describe('智能体的主页内容').optional(),
		}),
	},
	'task.agent_task_step_info.append_task_steps': {
		body: z.looseObject({
			idempotent_key: z.string().describe('幂等 key，可选').optional(),
			task_guid: z.string().describe('任务唯一ID').optional(),
			task_steps: z.array(z.looseObject({
				content: z.string().describe('操作内容'),
				quote: z.string().describe('引用信息').optional(),
				timestamp: z.number().int().describe('操作时间').optional(),
			})).describe('批量追加的执行日志').optional(),
		}),
	},
	'task.custom_field_options.create': {
		pathParams: z.strictObject({
			custom_field_guid: z.union([z.string(), z.number().transform(String)]).describe('要添加选项的自定义字段GUID，该字段必须是'),
		}),
		body: z.looseObject({
			color_index: z.number().int().describe('颜色索引值，支持0～54中的一个数字').optional(),
			insert_after: z.string().describe('要放到某个option之后的option_guid').optional(),
			insert_before: z.string().describe('要放到某个option之前的option_guid').optional(),
			is_hidden: z.boolean().describe('是否隐藏').optional(),
			name: z.string().describe('选项名称，最大50个字符'),
		}),
		response: z.looseObject({
			option: z.looseObject({
				color_index: z.number().int().describe('选项的颜色索引值，可以是0～54中的一个数字').optional(),
				guid: z.string().describe('选项的GUID').optional(),
				is_hidden: z.boolean().describe('选项是否隐藏').optional(),
				name: z.string().describe('选项名称，不能为空，最大50个字符').optional(),
			}).describe('创建的选项').optional(),
		}),
	},
	'task.custom_field_options.patch': {
		pathParams: z.strictObject({
			custom_field_guid: z.union([z.string(), z.number().transform(String)]).describe('要更新的选项的自定义字段GUID'),
			option_guid: z.union([z.string(), z.number().transform(String)]).describe('要更新的选项的GUID'),
		}),
		body: z.looseObject({
			option: z.looseObject({
				color_index: z.number().int().describe('颜色索引值，支持0～54中的一个数字').optional(),
				insert_after: z.string().describe('要放到某个option之后的option_guid').optional(),
				insert_before: z.string().describe('要放到某个option之前的option_guid').optional(),
				is_hidden: z.boolean().describe('是否隐藏').optional(),
				name: z.string().describe('选项名称').optional(),
			}).optional(),
			update_fields: z.array(z.unknown()).describe('要更新的字段名，支持;* `name`: 选项名称;* `color_index`: 选项的颜色索引值;* `is_hidden`: 是否从界面上隐藏;* `insert_before`: 将当前option放到同字段某个option之前').optional(),
		}),
		response: z.looseObject({
			option: z.looseObject({
				color_index: z.number().int().describe('选项的颜色索引值，可以是0～54中的一个数字').optional(),
				guid: z.string().describe('选项的GUID').optional(),
				is_hidden: z.boolean().describe('选项是否隐藏').optional(),
				name: z.string().describe('选项名称，不能为空，最大50个字符').optional(),
			}).describe('更新后的option数据').optional(),
		}),
	},
	'task.custom_fields.add': {
		pathParams: z.strictObject({
			custom_field_guid: z.union([z.string(), z.number().transform(String)]).describe('自定义字段GUID'),
		}),
		body: z.looseObject({
			resource_id: z.string().describe('要将自定义字段添加到的资源id，目前只支持tasklist_guid'),
			resource_type: z.string().describe('要将自定义字段添加到一个资源的资源类型'),
		}),
	},
	'task.custom_fields.create': {
		query: z.looseObject({
			user_id_type: z.enum(['open_id', 'user_id', 'union_id']).describe('表示user的ID的类型，支持open_id, user_id, union_id').optional(),
		}),
		body: z.looseObject({
			datetime_setting: z.looseObject({
				format: z.string().describe('日期时间格式，支持;<md-enum>;<md-enum-item key="yyyy-mm-dd" >以短横分隔的年月日，例如2023-08-24</md-enum-item>;<md-enum-item key="yyyy/mm/dd…').optional(),
			}).describe('时间日期类型的字段设置').optional(),
			member_setting: z.looseObject({
				multi: z.boolean().describe('是否支持多选').optional(),
			}).describe('人员类型的字段设置').optional(),
			multi_select_setting: z.looseObject({
				options: z.array(z.looseObject({
					color_index: z.number().int().describe('选项的颜色索引值，可以是0～54中的一个数字').optional(),
					is_hidden: z.boolean().describe('选项是否隐藏').optional(),
					name: z.string().describe('选项名称，不能为空，最大50个字符'),
				})).describe('多选选项').optional(),
			}).describe('多选设置').optional(),
			name: z.string().describe('字段名称，最大50个字符'),
			number_setting: z.looseObject({
				custom_symbol: z.string().describe('当`format`设为"custom"时，设置具体的自定义符号').optional(),
				custom_symbol_position: z.enum(['left', 'right']).describe('当`format`设为"custom"时，自定义符号相对于数字的显示位置').optional(),
				decimal_count: z.number().int().describe('数字类型自定义字段的值保留的小数位数').optional(),
				format: z.enum(['normal', 'percentage', 'cny', 'usd', 'custom']).describe('数字类型的自定义字段的值在App展示的格式').optional(),
				separator: z.enum(['none', 'thousand']).describe('数字类型自定义字段整数部分的分隔符样式').optional(),
			}).describe('数字类型的字段设置').optional(),
			resource_id: z.string().describe('自定义字段要归属的资源ID，当`resource_type`为"tasklist"时必须填写清单的GUID'),
			resource_type: z.string().describe('自定义字段要归属的资源类型，支持"tasklist"'),
			single_select_setting: z.looseObject({
				options: z.array(z.looseObject({
					color_index: z.number().int().describe('选项的颜色索引值，可以是0～54中的一个数字').optional(),
					is_hidden: z.boolean().describe('选项是否隐藏').optional(),
					name: z.string().describe('选项名称，不能为空，最大50个字符'),
				})).describe('单选选项').optional(),
			}).describe('单选设置').optional(),
			text_setting: z.record(z.string(), z.unknown()).describe('文本类型设置（目前文本类型没有可设置项）').optional(),
			type: z.enum(['number', 'datetime', 'member', 'single_select', 'multi_select', 'text']).describe('自定义字段类型'),
		}),
		response: z.looseObject({
			custom_field: z.looseObject({
				created_at: z.string().describe('自定义字段创建的时间戳(ms)').optional(),
				creator: z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				}).describe('清单所有者').optional(),
				datetime_setting: z.looseObject({
					format: z.string().describe('日期时间格式，支持;<md-enum>;<md-enum-item key="yyyy-mm-dd" >以短横分隔的年月日，例如2023-08-24</md-enum-item>;<md-enum-item key="yyyy/mm/dd…').optional(),
				}).describe('时间日期类型的字段设置').optional(),
				guid: z.string().describe('自定义字段的GUID').optional(),
				member_setting: z.looseObject({
					multi: z.boolean().describe('是否支持多选').optional(),
				}).describe('人员类型的字段设置').optional(),
				multi_select_setting: z.looseObject({
					options: z.array(z.unknown()).describe('单选选项').optional(),
				}).describe('多选类型的字段设置').optional(),
				name: z.string().describe('字段名称，支持最大50个字符').optional(),
				number_setting: z.looseObject({
					custom_symbol: z.string().describe('当`format`设为"custom"时，设置具体的自定义符号').optional(),
					custom_symbol_position: z.string().describe('当`format`设为"custom"时，自定义符号相对于数字的显示位置').optional(),
					decimal_count: z.number().int().describe('数字类型自定义字段的值保留的小数位数').optional(),
					format: z.string().describe('数字类型的自定义字段的值在App展示的格式').optional(),
					separator: z.string().describe('数字类型自定义字段整数部分的分隔符样式').optional(),
				}).describe('数字类型的字段设置').optional(),
				single_select_setting: z.looseObject({
					options: z.array(z.unknown()).describe('单选选项').optional(),
				}).describe('单选类型的字段设置').optional(),
				text_setting: z.record(z.string(), z.unknown()).describe('文本类型设置（目前文本类型没有可设置项）').optional(),
				type: z.string().describe('自定义字段类型').optional(),
				updated_at: z.string().describe('自定义字段的更新时间戳(ms)').optional(),
			}).describe('创建的自定义字段').optional(),
		}),
	},
	'task.custom_fields.get': {
		pathParams: z.strictObject({
			custom_field_guid: z.union([z.string(), z.number().transform(String)]).describe('自定义字段GUID'),
		}),
		query: z.looseObject({
			user_id_type: z.enum(['open_id', 'user_id', 'union_id']).describe('表示user的ID的类型，支持open_id, user_id, union_id').optional(),
		}),
		response: z.looseObject({
			custom_field: z.looseObject({
				created_at: z.string().describe('自定义字段创建的时间戳(ms)').optional(),
				creator: z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				}).describe('清单所有者').optional(),
				datetime_setting: z.looseObject({
					format: z.string().describe('日期时间格式，支持;<md-enum>;<md-enum-item key="yyyy-mm-dd" >以短横分隔的年月日，例如2023-08-24</md-enum-item>;<md-enum-item key="yyyy/mm/dd…').optional(),
				}).describe('时间日期类型的字段设置').optional(),
				guid: z.string().describe('自定义字段的GUID').optional(),
				member_setting: z.looseObject({
					multi: z.boolean().describe('是否支持多选').optional(),
				}).describe('人员类型的字段设置').optional(),
				multi_select_setting: z.looseObject({
					options: z.array(z.unknown()).describe('单选选项').optional(),
				}).describe('多选类型的字段设置').optional(),
				name: z.string().describe('字段名称，支持最大50个字符').optional(),
				number_setting: z.looseObject({
					custom_symbol: z.string().describe('当`format`设为"custom"时，设置具体的自定义符号').optional(),
					custom_symbol_position: z.string().describe('当`format`设为"custom"时，自定义符号相对于数字的显示位置').optional(),
					decimal_count: z.number().int().describe('数字类型自定义字段的值保留的小数位数').optional(),
					format: z.string().describe('数字类型的自定义字段的值在App展示的格式').optional(),
					separator: z.string().describe('数字类型自定义字段整数部分的分隔符样式').optional(),
				}).describe('数字类型的字段设置').optional(),
				single_select_setting: z.looseObject({
					options: z.array(z.unknown()).describe('单选选项').optional(),
				}).describe('单选类型的字段设置').optional(),
				text_setting: z.record(z.string(), z.unknown()).describe('文本类型设置（目前文本类型没有可设置项）').optional(),
				type: z.string().describe('自定义字段类型').optional(),
				updated_at: z.string().describe('自定义字段的更新时间戳(ms)').optional(),
			}).describe('获取的自定义字段数据').optional(),
		}),
	},
	'task.custom_fields.list': {
		query: z.looseObject({
			page_size: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('分页大小').optional(),
			page_token: z.string().describe('分页标记，第一次请求不填，表示从头开始遍历').optional(),
			resource_id: z.string().describe('要查询自定义字段的归属resource_id').optional(),
			resource_type: z.string().describe('资源类型，如提供则表示仅查询特定资源下的自定义字段').optional(),
			update_msec: z.string().describe('更新时间戳过滤条件(ms)').optional(),
			user_id_type: z.enum(['open_id', 'user_id', 'union_id']).describe('用户ID格式，支持open_id, user_id, union_id').optional(),
		}),
		response: z.looseObject({
			has_more: z.boolean().describe('是否有下一页的数据').optional(),
			items: z.array(z.looseObject({
				created_at: z.string().describe('自定义字段创建的时间戳(ms)').optional(),
				creator: z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				}).describe('清单所有者').optional(),
				datetime_setting: z.looseObject({
					format: z.string().describe('日期时间格式，支持;<md-enum>;<md-enum-item key="yyyy-mm-dd" >以短横分隔的年月日，例如2023-08-24</md-enum-item>;<md-enum-item key="yyyy/mm/dd…').optional(),
				}).describe('时间日期类型的字段设置').optional(),
				guid: z.string().describe('自定义字段的GUID').optional(),
				member_setting: z.looseObject({
					multi: z.boolean().describe('是否支持多选').optional(),
				}).describe('人员类型的字段设置').optional(),
				multi_select_setting: z.looseObject({
					options: z.array(z.unknown()).describe('单选选项').optional(),
				}).describe('多选类型的字段设置').optional(),
				name: z.string().describe('字段名称，支持最大50个字符').optional(),
				number_setting: z.looseObject({
					custom_symbol: z.string().describe('当`format`设为"custom"时，设置具体的自定义符号').optional(),
					custom_symbol_position: z.string().describe('当`format`设为"custom"时，自定义符号相对于数字的显示位置').optional(),
					decimal_count: z.number().int().describe('数字类型自定义字段的值保留的小数位数').optional(),
					format: z.string().describe('数字类型的自定义字段的值在App展示的格式').optional(),
					separator: z.string().describe('数字类型自定义字段整数部分的分隔符样式').optional(),
				}).describe('数字类型的字段设置').optional(),
				single_select_setting: z.looseObject({
					options: z.array(z.unknown()).describe('单选选项').optional(),
				}).describe('单选类型的字段设置').optional(),
				text_setting: z.record(z.string(), z.unknown()).describe('文本类型设置（目前文本类型没有可设置项）').optional(),
				type: z.string().describe('自定义字段类型').optional(),
				updated_at: z.string().describe('自定义字段的更新时间戳(ms)').optional(),
			})).describe('返回的自定义字段列表').optional(),
			page_token: z.string().describe('用于获取下一页数据的page_token').optional(),
		}),
	},
	'task.custom_fields.patch': {
		pathParams: z.strictObject({
			custom_field_guid: z.union([z.string(), z.number().transform(String)]).describe('自定义字段GUID'),
		}),
		query: z.looseObject({
			user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('用户ID格式').optional(),
		}),
		body: z.looseObject({
			custom_field: z.looseObject({
				datetime_setting: z.looseObject({
					format: z.string().describe('日期时间格式，支持;<md-enum>;<md-enum-item key="yyyy-mm-dd" >以短横分隔的年月日，例如2023-08-24</md-enum-item>;<md-enum-item key="yyyy/mm/dd…').optional(),
				}).describe('时间日期类型的字段设置').optional(),
				member_setting: z.looseObject({
					multi: z.boolean().describe('是否支持多选').optional(),
				}).describe('人员类型的字段设置').optional(),
				multi_select_setting: z.looseObject({
					options: z.array(z.unknown()).describe('多选选项').optional(),
				}).describe('多选设置').optional(),
				name: z.string().describe('字段名称，最大50个字符').optional(),
				number_setting: z.looseObject({
					custom_symbol: z.string().describe('当`format`设为"custom"时，设置具体的自定义符号').optional(),
					custom_symbol_position: z.enum(['left', 'right']).describe('当`format`设为"custom"时，自定义符号相对于数字的显示位置').optional(),
					decimal_count: z.number().int().describe('数字类型自定义字段的值保留的小数位数').optional(),
					format: z.enum(['normal', 'percentage', 'cny', 'usd', 'custom']).describe('数字类型的自定义字段的值在App展示的格式').optional(),
					separator: z.enum(['none', 'thousand']).describe('数字类型自定义字段整数部分的分隔符样式').optional(),
				}).describe('数字类型的字段设置').optional(),
				single_select_setting: z.looseObject({
					options: z.array(z.unknown()).describe('单选选项').optional(),
				}).describe('单选设置').optional(),
				text_setting: z.record(z.string(), z.unknown()).describe('文本类型设置（目前文本类型没有可设置项）').optional(),
			}).describe('要修改的自定义字段数据').optional(),
			update_fields: z.array(z.unknown()).describe('要修改的自定义字段类型，支持：;* `name`：自定义字段名称').optional(),
		}),
		response: z.looseObject({
			custom_field: z.looseObject({
				created_at: z.string().describe('自定义字段创建的时间戳(ms)').optional(),
				creator: z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				}).describe('清单所有者').optional(),
				datetime_setting: z.looseObject({
					format: z.string().describe('日期时间格式，支持;<md-enum>;<md-enum-item key="yyyy-mm-dd" >以短横分隔的年月日，例如2023-08-24</md-enum-item>;<md-enum-item key="yyyy/mm/dd…').optional(),
				}).describe('时间日期类型的字段设置').optional(),
				guid: z.string().describe('自定义字段的GUID').optional(),
				member_setting: z.looseObject({
					multi: z.boolean().describe('是否支持多选').optional(),
				}).describe('人员类型的字段设置').optional(),
				multi_select_setting: z.looseObject({
					options: z.array(z.unknown()).describe('单选选项').optional(),
				}).describe('多选类型的字段设置').optional(),
				name: z.string().describe('字段名称，支持最大50个字符').optional(),
				number_setting: z.looseObject({
					custom_symbol: z.string().describe('当`format`设为"custom"时，设置具体的自定义符号').optional(),
					custom_symbol_position: z.string().describe('当`format`设为"custom"时，自定义符号相对于数字的显示位置').optional(),
					decimal_count: z.number().int().describe('数字类型自定义字段的值保留的小数位数').optional(),
					format: z.string().describe('数字类型的自定义字段的值在App展示的格式').optional(),
					separator: z.string().describe('数字类型自定义字段整数部分的分隔符样式').optional(),
				}).describe('数字类型的字段设置').optional(),
				single_select_setting: z.looseObject({
					options: z.array(z.unknown()).describe('单选选项').optional(),
				}).describe('单选类型的字段设置').optional(),
				text_setting: z.record(z.string(), z.unknown()).describe('文本类型设置（目前文本类型没有可设置项）').optional(),
				type: z.string().describe('自定义字段类型').optional(),
				updated_at: z.string().describe('自定义字段的更新时间戳(ms)').optional(),
			}).describe('修改后的自定义字段设置').optional(),
		}),
	},
	'task.custom_fields.remove': {
		pathParams: z.strictObject({
			custom_field_guid: z.union([z.string(), z.number().transform(String)]).describe('自定义字段GUID'),
		}),
		body: z.looseObject({
			resource_id: z.string().describe('要从某个资源移除自定义字段的资源id，`resource_type`为"tasklist"时，需填写清单的GUID'),
			resource_type: z.string().describe('要从某个资源移除自定义字段的资源类型，目前只支持清单'),
		}),
	},
	'task.members.add': {
		pathParams: z.strictObject({
			task_guid: z.union([z.string(), z.number().transform(String)]).describe('要添加负责人的任务全局唯一ID'),
		}),
		query: z.looseObject({
			user_id_type: z.string().describe('表示user的ID的类型，支持open_id, user_id, union_id').optional(),
		}),
		body: z.looseObject({
			client_token: z.string().describe('幂等token，如果提供则实现幂等行为').optional(),
			members: z.array(z.looseObject({
				id: z.string().describe('表示member的id'),
				name: z.string().describe('成员名称').optional(),
				role: z.string().describe('成员的角色，可选值;* assignee;* follower'),
				type: z.string().describe('成员的类型').optional(),
			})).describe('要添加的members列表，单请求支持最大50个成员（去重后)'),
		}),
		response: z.looseObject({
			task: z.looseObject({
				agent_task_progress: z.string().describe('智能体任务进度').optional(),
				agent_task_status: z.number().int().describe('智能体任务状态').optional(),
				assignee_related: z.array(z.looseObject({
					completed_at: z.string().describe('会签任务中执行者完成的时间戳(ms)').optional(),
					id: z.string().describe('任务执行者的id').optional(),
				})).describe('任务执行者相关信息，如会签任务各执行者完成时间等').optional(),
				attachment_deliveries: z.array(z.looseObject({
					file_token: z.string().describe('附件在云文档系统中的token').optional(),
					guid: z.string().describe('附件guid').optional(),
					is_cover: z.boolean().describe('是否是封面图').optional(),
					name: z.string().describe('附件名').optional(),
					resource: z.record(z.string(), z.unknown()).describe('附件归属的资源').optional(),
					size: z.number().int().describe('附件的字节大小').optional(),
					uploaded_at: z.string().describe('上传时间戳(ms)').optional(),
					uploader: z.record(z.string(), z.unknown()).describe('清单所有者').optional(),
					url: z.string().describe('附件的临时下载url，有效时间3分钟，且只允许调用3次进行附件下载').optional(),
				})).describe('智能体附件类交付物').optional(),
				attachments: z.array(z.looseObject({
					file_token: z.string().describe('附件在云文档系统中的token').optional(),
					guid: z.string().describe('附件guid').optional(),
					is_cover: z.boolean().describe('是否是封面图').optional(),
					name: z.string().describe('附件名').optional(),
					resource: z.record(z.string(), z.unknown()).describe('附件归属的资源').optional(),
					size: z.number().int().describe('附件的字节大小').optional(),
					uploaded_at: z.string().describe('上传时间戳(ms)').optional(),
					uploader: z.record(z.string(), z.unknown()).describe('清单所有者').optional(),
				})).describe('任务的附件列表').optional(),
				completed_at: z.string().describe('任务完成的时间戳(ms)').optional(),
				created_at: z.string().describe('任务创建时间戳(ms)').optional(),
				creator: z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				}).describe('清单所有者').optional(),
				custom_complete: z.looseObject({
					android: z.record(z.string(), z.unknown()).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
					ios: z.record(z.string(), z.unknown()).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
					pc: z.record(z.string(), z.unknown()).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
				}).describe('任务自定义完成配置').optional(),
				custom_fields: z.array(z.looseObject({
					datetime_value: z.string().describe('日期类型自定义字段值').optional(),
					guid: z.string().describe('字段GUID').optional(),
					member_value: z.array(z.unknown()).describe('人员类型的自定义字段值，可以设置1个或多个用户的id（遵循member格式，只支持user类型）').optional(),
					multi_select_value: z.array(z.unknown()).describe('多选类型字段值，可以填写一个或多个本字段的option_guid').optional(),
					name: z.string().describe('自定义字段名').optional(),
					number_value: z.string().describe('数字类型的自定义字段值，填写一个合法数字的字符串表示，空字符串表示设为空').optional(),
					single_select_value: z.string().describe('单选类型字段值，填写一个字段选项的option_guid').optional(),
					text_value: z.string().describe('文本类型字段值').optional(),
					type: z.string().describe('自定义字段类型，支持"member", "datetime", "number", "single_select", "multi_select"五种类型').optional(),
				})).describe('任务的自定义字段值').optional(),
				dependencies: z.array(z.looseObject({
					task_guid: z.string().describe('依赖任务的GUID').optional(),
					type: z.string().describe('依赖类型').optional(),
				})).describe('任务依赖').optional(),
				description: z.string().describe('任务描述').optional(),
				due: z.looseObject({
					is_all_day: z.boolean().describe('是否截止到一个日期').optional(),
					timestamp: z.string().describe('截止时间/日期的时间戳，距1970-01-01 00:00:00 UTC的毫秒数').optional(),
				}).describe('任务截止时间').optional(),
				extra: z.string().describe('任务附带的自定义数据').optional(),
				guid: z.string().describe('任务guid，任务的唯一ID').optional(),
				is_milestone: z.boolean().describe('是否是里程碑任务').optional(),
				members: z.array(z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				})).describe('任务成员列表').optional(),
				mode: z.number().int().describe('任务的模式').optional(),
				next_task_guid: z.string().describe('重复任务的下一个任务').optional(),
				origin: z.looseObject({
					href: z.record(z.string(), z.unknown()).describe('任务关联的来源平台详情页链接').optional(),
					platform_i18n_name: z.record(z.string(), z.unknown()).describe('自定义完成的弹出提示').optional(),
				}).describe('任务关联的第三方平台来源信息').optional(),
				parent_task_guid: z.string().describe('如果当前任务为某个任务的子任务，返回父任务的guid').optional(),
				positive_reminders: z.array(z.looseObject({
					id: z.string().describe('提醒时间设置的 ID').optional(),
					relative_fire_minute: z.number().int().describe('相对于截止时间的提醒时间分钟数').optional(),
				})).describe('正数协议任务提醒').optional(),
				reminders: z.array(z.looseObject({
					id: z.string().describe('提醒时间设置的 ID').optional(),
					relative_fire_minute: z.number().int().describe('相对于截止时间的提醒时间分钟数').optional(),
				})).describe('任务的提醒配置列表').optional(),
				repeat_rule: z.string().describe('如果设置，则该任务为“重复任务”').optional(),
				source: z.number().int().describe('任务创建的来源').optional(),
				start: z.looseObject({
					is_all_day: z.boolean().describe('是否开始于一个日期').optional(),
					timestamp: z.string().describe('开始时间/日期的时间戳，距1970-01-01 00:00:00的毫秒数').optional(),
				}).describe('任务的开始时间(ms)').optional(),
				status: z.string().describe('任务的状态，支持"todo"和"done"两种状态').optional(),
				subtask_count: z.number().int().describe('该任务的子任务的个数').optional(),
				summary: z.string().describe('任务标题').optional(),
				task_id: z.string().describe('任务界面上的代码').optional(),
				tasklists: z.array(z.looseObject({
					section_guid: z.string().describe('任务所在清单的自定义分组guid').optional(),
					tasklist_guid: z.string().describe('任务所在清单的guid').optional(),
				})).describe('任务所属清单的名字').optional(),
				text_deliveries: z.array(z.unknown()).describe('智能体文本类交付物').optional(),
				updated_at: z.string().describe('任务最后一次更新的时间戳(ms)').optional(),
				url: z.string().describe('任务的分享链接').optional(),
			}).describe('更新完成后的任务实体数据').optional(),
		}),
	},
	'task.members.remove': {
		pathParams: z.strictObject({
			task_guid: z.union([z.string(), z.number().transform(String)]).describe('要移除成员的任务全局唯一ID'),
		}),
		query: z.looseObject({
			user_id_type: z.string().describe('表示user的ID的类型，支持open_id, user_id, union_id').optional(),
		}),
		body: z.looseObject({
			members: z.array(z.looseObject({
				id: z.string().describe('表示member的id'),
				name: z.string().describe('成员名称').optional(),
				role: z.string().describe('成员角色，支持"assignee"或者"follower"'),
				type: z.string().describe('成员的类型').optional(),
			})).describe('要移除的member列表'),
		}),
		response: z.looseObject({
			task: z.looseObject({
				agent_task_progress: z.string().describe('智能体任务进度').optional(),
				agent_task_status: z.number().int().describe('智能体任务状态').optional(),
				assignee_related: z.array(z.looseObject({
					completed_at: z.string().describe('会签任务中执行者完成的时间戳(ms)').optional(),
					id: z.string().describe('任务执行者的id').optional(),
				})).describe('任务执行者相关信息，如会签任务各执行者完成时间等').optional(),
				attachment_deliveries: z.array(z.looseObject({
					file_token: z.string().describe('附件在云文档系统中的token').optional(),
					guid: z.string().describe('附件guid').optional(),
					is_cover: z.boolean().describe('是否是封面图').optional(),
					name: z.string().describe('附件名').optional(),
					resource: z.record(z.string(), z.unknown()).describe('附件归属的资源').optional(),
					size: z.number().int().describe('附件的字节大小').optional(),
					uploaded_at: z.string().describe('上传时间戳(ms)').optional(),
					uploader: z.record(z.string(), z.unknown()).describe('清单所有者').optional(),
					url: z.string().describe('附件的临时下载url，有效时间3分钟，且只允许调用3次进行附件下载').optional(),
				})).describe('智能体附件类交付物').optional(),
				attachments: z.array(z.looseObject({
					file_token: z.string().describe('附件在云文档系统中的token').optional(),
					guid: z.string().describe('附件guid').optional(),
					is_cover: z.boolean().describe('是否是封面图').optional(),
					name: z.string().describe('附件名').optional(),
					resource: z.record(z.string(), z.unknown()).describe('附件归属的资源').optional(),
					size: z.number().int().describe('附件的字节大小').optional(),
					uploaded_at: z.string().describe('上传时间戳(ms)').optional(),
					uploader: z.record(z.string(), z.unknown()).describe('清单所有者').optional(),
				})).describe('任务的附件列表').optional(),
				completed_at: z.string().describe('任务完成的时间戳(ms)').optional(),
				created_at: z.string().describe('任务创建时间戳(ms)').optional(),
				creator: z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				}).describe('清单所有者').optional(),
				custom_complete: z.looseObject({
					android: z.record(z.string(), z.unknown()).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
					ios: z.record(z.string(), z.unknown()).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
					pc: z.record(z.string(), z.unknown()).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
				}).describe('任务自定义完成配置').optional(),
				custom_fields: z.array(z.looseObject({
					datetime_value: z.string().describe('日期类型自定义字段值').optional(),
					guid: z.string().describe('字段GUID').optional(),
					member_value: z.array(z.unknown()).describe('人员类型的自定义字段值，可以设置1个或多个用户的id（遵循member格式，只支持user类型）').optional(),
					multi_select_value: z.array(z.unknown()).describe('多选类型字段值，可以填写一个或多个本字段的option_guid').optional(),
					name: z.string().describe('自定义字段名').optional(),
					number_value: z.string().describe('数字类型的自定义字段值，填写一个合法数字的字符串表示，空字符串表示设为空').optional(),
					single_select_value: z.string().describe('单选类型字段值，填写一个字段选项的option_guid').optional(),
					text_value: z.string().describe('文本类型字段值').optional(),
					type: z.string().describe('自定义字段类型，支持"member", "datetime", "number", "single_select", "multi_select"五种类型').optional(),
				})).describe('任务的自定义字段值').optional(),
				dependencies: z.array(z.looseObject({
					task_guid: z.string().describe('依赖任务的GUID').optional(),
					type: z.string().describe('依赖类型').optional(),
				})).describe('任务依赖').optional(),
				description: z.string().describe('任务描述').optional(),
				due: z.looseObject({
					is_all_day: z.boolean().describe('是否截止到一个日期').optional(),
					timestamp: z.string().describe('截止时间/日期的时间戳，距1970-01-01 00:00:00 UTC的毫秒数').optional(),
				}).describe('任务截止时间').optional(),
				extra: z.string().describe('任务附带的自定义数据').optional(),
				guid: z.string().describe('任务guid，任务的唯一ID').optional(),
				is_milestone: z.boolean().describe('是否是里程碑任务').optional(),
				members: z.array(z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				})).describe('任务成员列表').optional(),
				mode: z.number().int().describe('任务的模式').optional(),
				next_task_guid: z.string().describe('重复任务的下一个任务').optional(),
				origin: z.looseObject({
					href: z.record(z.string(), z.unknown()).describe('任务关联的来源平台详情页链接').optional(),
					platform_i18n_name: z.record(z.string(), z.unknown()).describe('自定义完成的弹出提示').optional(),
				}).describe('任务关联的第三方平台来源信息').optional(),
				parent_task_guid: z.string().describe('如果当前任务为某个任务的子任务，返回父任务的guid').optional(),
				positive_reminders: z.array(z.looseObject({
					id: z.string().describe('提醒时间设置的 ID').optional(),
					relative_fire_minute: z.number().int().describe('相对于截止时间的提醒时间分钟数').optional(),
				})).describe('正数协议任务提醒').optional(),
				reminders: z.array(z.looseObject({
					id: z.string().describe('提醒时间设置的 ID').optional(),
					relative_fire_minute: z.number().int().describe('相对于截止时间的提醒时间分钟数').optional(),
				})).describe('任务的提醒配置列表').optional(),
				repeat_rule: z.string().describe('如果设置，则该任务为“重复任务”').optional(),
				source: z.number().int().describe('任务创建的来源').optional(),
				start: z.looseObject({
					is_all_day: z.boolean().describe('是否开始于一个日期').optional(),
					timestamp: z.string().describe('开始时间/日期的时间戳，距1970-01-01 00:00:00的毫秒数').optional(),
				}).describe('任务的开始时间(ms)').optional(),
				status: z.string().describe('任务的状态，支持"todo"和"done"两种状态').optional(),
				subtask_count: z.number().int().describe('该任务的子任务的个数').optional(),
				summary: z.string().describe('任务标题').optional(),
				task_id: z.string().describe('任务界面上的代码').optional(),
				tasklists: z.array(z.looseObject({
					section_guid: z.string().describe('任务所在清单的自定义分组guid').optional(),
					tasklist_guid: z.string().describe('任务所在清单的guid').optional(),
				})).describe('任务所属清单的名字').optional(),
				text_deliveries: z.array(z.unknown()).describe('智能体文本类交付物').optional(),
				updated_at: z.string().describe('任务最后一次更新的时间戳(ms)').optional(),
				url: z.string().describe('任务的分享链接').optional(),
			}).describe('移除成员后的任务数据').optional(),
		}),
	},
	'task.sections.create': {
		query: z.looseObject({
			user_id_type: z.string().describe('表示user的ID的类型，支持open_id, user_id, union_id').optional(),
		}),
		body: z.looseObject({
			insert_after: z.string().describe('要将新分组插入到自定义分分组的后面的目标分组的guid').optional(),
			insert_before: z.string().describe('要将新分组插入到自定义分分组的前面的目标分组的guid').optional(),
			name: z.string().describe('自定义分组名'),
			resource_id: z.string().describe('自定义分组要归属的资源id').optional(),
			resource_type: z.string().describe('自定义分组的资源类型，支持"tasklist"（清单）或者"my_tasks"（我负责的）'),
		}),
		response: z.looseObject({
			section: z.looseObject({
				created_at: z.string().describe('自定义分组创建时间戳(ms)').optional(),
				creator: z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				}).describe('清单所有者').optional(),
				guid: z.string().describe('自定义分组的GUID').optional(),
				is_default: z.boolean().describe('分组是否为默认自定义分组').optional(),
				name: z.string().describe('自定义分组名').optional(),
				resource_type: z.string().describe('资源类型').optional(),
				tasklist: z.looseObject({
					guid: z.string().describe('清单GUID').optional(),
					name: z.string().describe('清单名字').optional(),
				}).describe('如果该分组归属于清单，展示清单的简要信息').optional(),
				updated_at: z.string().describe('自定义分组最近一次更新时间戳(ms)').optional(),
			}).describe('创建的自定义分组数据').optional(),
		}),
	},
	'task.sections.delete': {
		pathParams: z.strictObject({
			section_guid: z.union([z.string(), z.number().transform(String)]).describe('要删除的自定义分组全局唯一ID'),
		}),
	},
	'task.sections.get': {
		pathParams: z.strictObject({
			section_guid: z.union([z.string(), z.number().transform(String)]).describe('要获取的自定义分组GUID'),
		}),
		query: z.looseObject({
			user_id_type: z.string().describe('表示user的ID的类型，支持open_id, user_id, union_id').optional(),
		}),
		response: z.looseObject({
			section: z.looseObject({
				created_at: z.string().describe('自定义分组创建时间戳(ms)').optional(),
				creator: z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				}).describe('清单所有者').optional(),
				guid: z.string().describe('自定义分组的GUID').optional(),
				is_default: z.boolean().describe('分组是否为默认自定义分组').optional(),
				name: z.string().describe('自定义分组名').optional(),
				resource_type: z.string().describe('资源类型').optional(),
				tasklist: z.looseObject({
					guid: z.string().describe('清单GUID').optional(),
					name: z.string().describe('清单名字').optional(),
				}).describe('如果该分组归属于清单，展示清单的简要信息').optional(),
				updated_at: z.string().describe('自定义分组最近一次更新时间戳(ms)').optional(),
			}).describe('获取的自定义分组详情').optional(),
		}),
	},
	'task.sections.list': {
		query: z.looseObject({
			page_size: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('分页大小').optional(),
			page_token: z.string().describe('分页标记，第一次请求不填，表示从头开始遍历').optional(),
			resource_id: z.string().describe('如`resource_type`为"tasklist"，这里需要填写要列取自定义分组的清单的GUID').optional(),
			resource_type: z.string().describe('自定义分组所属的资源类型'),
			update_msec: z.string().describe('更新时间戳过滤(ms)').optional(),
			user_id_type: z.string().describe('表示user的ID的类型，支持open_id, user_id, union_id').optional(),
		}),
		response: z.looseObject({
			has_more: z.boolean().describe('是否有更多数据').optional(),
			items: z.array(z.looseObject({
				guid: z.string().describe('自定义分组的全局唯一ID').optional(),
				is_default: z.boolean().describe('是否是默认分组').optional(),
				name: z.string().describe('自定义分组的名称').optional(),
			})).describe('自定义分组的摘要列表').optional(),
			page_token: z.string().describe('获取下一页数据的分页标记，没有更多数据时返回空').optional(),
		}),
	},
	'task.sections.patch': {
		pathParams: z.strictObject({
			section_guid: z.union([z.string(), z.number().transform(String)]).describe('要更新的自定义分组GUID'),
		}),
		query: z.looseObject({
			user_id_type: z.string().describe('表示user的ID的类型，支持open_id, user_id, union_id').optional(),
		}),
		body: z.looseObject({
			section: z.looseObject({
				insert_after: z.string().describe('要将新分组插入到自定义分分组的后面的目标分组的guid').optional(),
				insert_before: z.string().describe('要将新分组插入到自定义分分组的前面的目标分组的guid').optional(),
				name: z.string().describe('自定义分组名').optional(),
			}).describe('要更新的自定义分组的数据'),
			update_fields: z.array(z.unknown()).describe('要更新的字段名，支持：;* `name` - 自定义字段名字;* `insert_before` - 要让当前自定义分组放到某个自定义分组前面的section_guid，用于改变当前自定义分组的位置'),
		}),
		response: z.looseObject({
			section: z.looseObject({
				created_at: z.string().describe('自定义分组创建时间戳(ms)').optional(),
				creator: z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				}).describe('清单所有者').optional(),
				guid: z.string().describe('自定义分组的GUID').optional(),
				is_default: z.boolean().describe('分组是否为默认自定义分组').optional(),
				name: z.string().describe('自定义分组名').optional(),
				resource_type: z.string().describe('资源类型').optional(),
				tasklist: z.looseObject({
					guid: z.string().describe('清单GUID').optional(),
					name: z.string().describe('清单名字').optional(),
				}).describe('如果该分组归属于清单，展示清单的简要信息').optional(),
				updated_at: z.string().describe('自定义分组最近一次更新时间戳(ms)').optional(),
			}).describe('更新后的自定义分组').optional(),
		}),
	},
	'task.sections.tasks': {
		pathParams: z.strictObject({
			section_guid: z.union([z.string(), z.number().transform(String)]).describe('要获取任务的自定义分组全局唯一ID'),
		}),
		query: z.looseObject({
			completed: z.union([z.boolean(), z.stringbool()]).describe('按照任务状态过滤，如果不填写则表示不按完成状态过滤').optional(),
			created_from: z.string().describe('按照创建时间筛选的起始时间戳（ms)，如不填写则为首个任务的创建时刻').optional(),
			created_to: z.string().describe('按照创建时间筛选的起始时间戳（ms)，如不填写则为最后任务的创建时刻').optional(),
			page_size: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('分页大小').optional(),
			page_token: z.string().describe('分页标记').optional(),
			user_id_type: z.string().describe('表示user的ID的类型，支持open_id, user_id, union_id').optional(),
		}),
		response: z.looseObject({
			has_more: z.boolean().describe('是否有更多数据').optional(),
			items: z.array(z.looseObject({
				completed_at: z.string().describe('任务完成的时间戳(ms)，为0表示未完成').optional(),
				due: z.looseObject({
					is_all_day: z.boolean().describe('是否截止到一个日期').optional(),
					timestamp: z.string().describe('截止时间/日期的时间戳，距1970-01-01 00:00:00 UTC的毫秒数').optional(),
				}).describe('任务截止时间').optional(),
				guid: z.string().describe('任务GUID').optional(),
				members: z.array(z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				})).describe('任务成员列表').optional(),
				start: z.looseObject({
					is_all_day: z.boolean().describe('是否开始于一个日期').optional(),
					timestamp: z.string().describe('开始时间/日期的时间戳，距1970-01-01 00:00:00的毫秒数').optional(),
				}).describe('任务开始时间').optional(),
				subtask_count: z.number().int().describe('子任务的个数').optional(),
				summary: z.string().describe('任务标题').optional(),
			})).describe('任务摘要信息').optional(),
			page_token: z.string().describe('获取下一页的分页标记，无更多数据时返回空').optional(),
		}),
	},
	'task.subtasks.create': {
		pathParams: z.strictObject({
			task_guid: z.union([z.string(), z.number().transform(String)]).describe('父任务GUID'),
		}),
		query: z.looseObject({
			user_id_type: z.string().describe('表示user的ID的类型，支持open_id, user_id, union_id').optional(),
		}),
		body: z.looseObject({
			agent_task_progress: z.string().describe('智能体任务进度').optional(),
			agent_task_status: z.number().int().describe('智能体任务状态').optional(),
			client_token: z.string().describe('幂等token，如果填写则触发幂等行为').optional(),
			completed_at: z.string().describe('任务的完成时刻时间戳(ms)').optional(),
			custom_complete: z.looseObject({
				android: z.looseObject({
					href: z.string().describe('自定义完成的跳转url').optional(),
					tip: z.record(z.string(), z.unknown()).describe('自定义完成的弹出提示').optional(),
				}).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
				ios: z.looseObject({
					href: z.string().describe('自定义完成的跳转url').optional(),
					tip: z.record(z.string(), z.unknown()).describe('自定义完成的弹出提示').optional(),
				}).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
				pc: z.looseObject({
					href: z.string().describe('自定义完成的跳转url').optional(),
					tip: z.record(z.string(), z.unknown()).describe('自定义完成的弹出提示').optional(),
				}).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
			}).describe('如果设置，则将任务设计为“自定义完成”').optional(),
			custom_fields: z.array(z.looseObject({
				datetime_value: z.string().describe('日期类型自定义字段值，可以输入一个表示日期的以毫秒为单位的字符串').optional(),
				guid: z.string().describe('自定义字段guid'),
				member_value: z.array(z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				})).describe('人员类型的自定义字段值').optional(),
				multi_select_value: z.array(z.unknown()).describe('多选类型字段值，可以填写一个或多个本字段的option_guid').optional(),
				number_value: z.string().describe('数字类型的自定义字段值，填写一个合法数字的字符串表示，空字符串表示设为空').optional(),
				single_select_value: z.string().describe('单选类型字段值，填写一个字段选项的option_guid').optional(),
				text_value: z.string().describe('文本类型字段值').optional(),
			})).describe('自定义字段值').optional(),
			description: z.string().describe('任务描述').optional(),
			docx_source: z.looseObject({
				block_id: z.string().describe('任务关联的文档block_id，要求block_id存在于token对应文档中、且block_id没有绑定过其他的任务'),
				token: z.string().describe('任务关联的文档token，要求：如果使用tenant_access_token请求，则请求机器人有文档编辑权限'),
			}).describe('任务的新版云文档来源').optional(),
			due: z.looseObject({
				is_all_day: z.boolean().describe('是否截止到一个日期').optional(),
				timestamp: z.string().describe('截止时间/日期的时间戳，距1970-01-01 00:00:00 UTC的毫秒数').optional(),
			}).describe('任务截止时间戳(ms)，截止时间戳和截止日期选择一个填写').optional(),
			extra: z.string().describe('调用者可以传入的任意附带到任务上的数据').optional(),
			is_milestone: z.boolean().describe('是否是里程碑任务').optional(),
			members: z.array(z.looseObject({
				id: z.string().describe('表示member的id'),
				name: z.string().describe('成员名称').optional(),
				role: z.string().describe('成员角色，支持"assignee"或者"follower"'),
				type: z.string().describe('成员的类型').optional(),
			})).describe('任务成员列表').optional(),
			mode: z.number().int().describe('任务完成模式, 1 - 会签任务').optional(),
			origin: z.looseObject({
				href: z.looseObject({
					title: z.string().describe('链接对应的标题').optional(),
					url: z.string().describe('链接对应的地址').optional(),
				}).describe('任务关联的来源平台详情页链接').optional(),
				platform_i18n_name: z.looseObject({
					de_de: z.string().describe('德语').optional(),
					en_us: z.string().describe('英文').optional(),
					es_es: z.string().describe('西班牙语').optional(),
					fr_fr: z.string().describe('法语').optional(),
					it_it: z.string().describe('意大利语').optional(),
					ja_jp: z.string().describe('日语').optional(),
					ko_kr: z.string().describe('韩语').optional(),
					ru_ru: z.string().describe('俄语').optional(),
					th_th: z.string().describe('泰语').optional(),
					zh_cn: z.string().describe('中文').optional(),
					zh_hk: z.string().describe('中文（中国香港）').optional(),
					zh_tw: z.string().describe('中文（中国台湾）').optional(),
				}).describe('自定义完成的弹出提示').optional(),
			}).describe('任务关联的第三方平台来源信息').optional(),
			reminders: z.array(z.looseObject({
				relative_fire_minute: z.number().int().describe('相对于截止时间的提醒时间分钟数'),
			})).describe('任务提醒').optional(),
			repeat_rule: z.string().describe('如果设置，则该任务为“重复任务”').optional(),
			start: z.looseObject({
				is_all_day: z.boolean().describe('是否开始于一个日期').optional(),
				timestamp: z.string().describe('开始时间/日期的时间戳，距1970-01-01 00:00:00的毫秒数').optional(),
			}).describe('任务的开始时间(ms)').optional(),
			summary: z.string().describe('任务标题'),
			tasklists: z.array(z.looseObject({
				section_guid: z.string().describe('任务所在清单的自定义分组guid').optional(),
				tasklist_guid: z.string().describe('任务所在清单的guid').optional(),
			})).describe('任务所在清单的信息').optional(),
			text_deliveries: z.array(z.unknown()).describe('智能体文本类交付物').optional(),
		}),
		response: z.looseObject({
			subtask: z.looseObject({
				agent_task_progress: z.string().describe('智能体任务进度').optional(),
				agent_task_status: z.number().int().describe('智能体任务状态').optional(),
				assignee_related: z.array(z.looseObject({
					completed_at: z.string().describe('会签任务中执行者完成的时间戳(ms)').optional(),
					id: z.string().describe('任务执行者的id').optional(),
				})).describe('任务执行者相关信息，如会签任务各执行者完成时间等').optional(),
				attachment_deliveries: z.array(z.looseObject({
					file_token: z.string().describe('附件在云文档系统中的token').optional(),
					guid: z.string().describe('附件guid').optional(),
					is_cover: z.boolean().describe('是否是封面图').optional(),
					name: z.string().describe('附件名').optional(),
					resource: z.record(z.string(), z.unknown()).describe('附件归属的资源').optional(),
					size: z.number().int().describe('附件的字节大小').optional(),
					uploaded_at: z.string().describe('上传时间戳(ms)').optional(),
					uploader: z.record(z.string(), z.unknown()).describe('清单所有者').optional(),
					url: z.string().describe('附件的临时下载url，有效时间3分钟，且只允许调用3次进行附件下载').optional(),
				})).describe('智能体附件类交付物').optional(),
				attachments: z.array(z.looseObject({
					file_token: z.string().describe('附件在云文档系统中的token').optional(),
					guid: z.string().describe('附件guid').optional(),
					is_cover: z.boolean().describe('是否是封面图').optional(),
					name: z.string().describe('附件名').optional(),
					resource: z.record(z.string(), z.unknown()).describe('附件归属的资源').optional(),
					size: z.number().int().describe('附件的字节大小').optional(),
					uploaded_at: z.string().describe('上传时间戳(ms)').optional(),
					uploader: z.record(z.string(), z.unknown()).describe('清单所有者').optional(),
				})).describe('任务的附件列表').optional(),
				completed_at: z.string().describe('任务完成的时间戳(ms)').optional(),
				created_at: z.string().describe('任务创建时间戳(ms)').optional(),
				creator: z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				}).describe('清单所有者').optional(),
				custom_complete: z.looseObject({
					android: z.record(z.string(), z.unknown()).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
					ios: z.record(z.string(), z.unknown()).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
					pc: z.record(z.string(), z.unknown()).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
				}).describe('任务自定义完成配置').optional(),
				custom_fields: z.array(z.looseObject({
					datetime_value: z.string().describe('日期类型自定义字段值').optional(),
					guid: z.string().describe('字段GUID').optional(),
					member_value: z.array(z.unknown()).describe('人员类型的自定义字段值，可以设置1个或多个用户的id（遵循member格式，只支持user类型）').optional(),
					multi_select_value: z.array(z.unknown()).describe('多选类型字段值，可以填写一个或多个本字段的option_guid').optional(),
					name: z.string().describe('自定义字段名').optional(),
					number_value: z.string().describe('数字类型的自定义字段值，填写一个合法数字的字符串表示，空字符串表示设为空').optional(),
					single_select_value: z.string().describe('单选类型字段值，填写一个字段选项的option_guid').optional(),
					text_value: z.string().describe('文本类型字段值').optional(),
					type: z.string().describe('自定义字段类型，支持"member", "datetime", "number", "single_select", "multi_select"五种类型').optional(),
				})).describe('任务的自定义字段值').optional(),
				dependencies: z.array(z.looseObject({
					task_guid: z.string().describe('依赖任务的GUID').optional(),
					type: z.string().describe('依赖类型').optional(),
				})).describe('任务依赖').optional(),
				description: z.string().describe('任务描述').optional(),
				due: z.looseObject({
					is_all_day: z.boolean().describe('是否截止到一个日期').optional(),
					timestamp: z.string().describe('截止时间/日期的时间戳，距1970-01-01 00:00:00 UTC的毫秒数').optional(),
				}).describe('任务截止时间').optional(),
				extra: z.string().describe('任务附带的自定义数据').optional(),
				guid: z.string().describe('任务guid，任务的唯一ID').optional(),
				is_milestone: z.boolean().describe('是否是里程碑任务').optional(),
				members: z.array(z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				})).describe('任务成员列表').optional(),
				mode: z.number().int().describe('任务的模式').optional(),
				next_task_guid: z.string().describe('重复任务的下一个任务').optional(),
				origin: z.looseObject({
					href: z.record(z.string(), z.unknown()).describe('任务关联的来源平台详情页链接').optional(),
					platform_i18n_name: z.record(z.string(), z.unknown()).describe('自定义完成的弹出提示').optional(),
				}).describe('任务关联的第三方平台来源信息').optional(),
				parent_task_guid: z.string().describe('如果当前任务为某个任务的子任务，返回父任务的guid').optional(),
				positive_reminders: z.array(z.looseObject({
					id: z.string().describe('提醒时间设置的 ID').optional(),
					relative_fire_minute: z.number().int().describe('相对于截止时间的提醒时间分钟数').optional(),
				})).describe('正数协议任务提醒').optional(),
				reminders: z.array(z.looseObject({
					id: z.string().describe('提醒时间设置的 ID').optional(),
					relative_fire_minute: z.number().int().describe('相对于截止时间的提醒时间分钟数').optional(),
				})).describe('任务的提醒配置列表').optional(),
				repeat_rule: z.string().describe('如果设置，则该任务为“重复任务”').optional(),
				source: z.number().int().describe('任务创建的来源').optional(),
				start: z.looseObject({
					is_all_day: z.boolean().describe('是否开始于一个日期').optional(),
					timestamp: z.string().describe('开始时间/日期的时间戳，距1970-01-01 00:00:00的毫秒数').optional(),
				}).describe('任务的开始时间(ms)').optional(),
				status: z.string().describe('任务的状态，支持"todo"和"done"两种状态').optional(),
				subtask_count: z.number().int().describe('该任务的子任务的个数').optional(),
				summary: z.string().describe('任务标题').optional(),
				task_id: z.string().describe('任务界面上的代码').optional(),
				tasklists: z.array(z.looseObject({
					section_guid: z.string().describe('任务所在清单的自定义分组guid').optional(),
					tasklist_guid: z.string().describe('任务所在清单的guid').optional(),
				})).describe('任务所属清单的名字').optional(),
				text_deliveries: z.array(z.unknown()).describe('智能体文本类交付物').optional(),
				updated_at: z.string().describe('任务最后一次更新的时间戳(ms)').optional(),
				url: z.string().describe('任务的分享链接').optional(),
			}).describe('创建的任务').optional(),
		}),
	},
	'task.subtasks.list': {
		pathParams: z.strictObject({
			task_guid: z.union([z.string(), z.number().transform(String)]).describe('父任务的全局唯一ID'),
		}),
		query: z.looseObject({
			page_size: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('分页大小').optional(),
			page_token: z.string().describe('分页标记，第一次请求不填，表示从头开始遍历').optional(),
			user_id_type: z.string().describe('表示user的ID的类型，支持open_id, user_id, union_id').optional(),
		}),
		response: z.looseObject({
			has_more: z.boolean().describe('是否还有更多项').optional(),
			items: z.array(z.looseObject({
				agent_task_progress: z.string().describe('智能体任务进度').optional(),
				agent_task_status: z.number().int().describe('智能体任务状态').optional(),
				assignee_related: z.array(z.looseObject({
					completed_at: z.string().describe('会签任务中执行者完成的时间戳(ms)').optional(),
					id: z.string().describe('任务执行者的id').optional(),
				})).describe('任务执行者相关信息，如会签任务各执行者完成时间等').optional(),
				attachment_deliveries: z.array(z.looseObject({
					file_token: z.string().describe('附件在云文档系统中的token').optional(),
					guid: z.string().describe('附件guid').optional(),
					is_cover: z.boolean().describe('是否是封面图').optional(),
					name: z.string().describe('附件名').optional(),
					resource: z.record(z.string(), z.unknown()).describe('附件归属的资源').optional(),
					size: z.number().int().describe('附件的字节大小').optional(),
					uploaded_at: z.string().describe('上传时间戳(ms)').optional(),
					uploader: z.record(z.string(), z.unknown()).describe('清单所有者').optional(),
					url: z.string().describe('附件的临时下载url，有效时间3分钟，且只允许调用3次进行附件下载').optional(),
				})).describe('智能体附件类交付物').optional(),
				attachments: z.array(z.looseObject({
					file_token: z.string().describe('附件在云文档系统中的token').optional(),
					guid: z.string().describe('附件guid').optional(),
					is_cover: z.boolean().describe('是否是封面图').optional(),
					name: z.string().describe('附件名').optional(),
					resource: z.record(z.string(), z.unknown()).describe('附件归属的资源').optional(),
					size: z.number().int().describe('附件的字节大小').optional(),
					uploaded_at: z.string().describe('上传时间戳(ms)').optional(),
					uploader: z.record(z.string(), z.unknown()).describe('清单所有者').optional(),
				})).describe('任务的附件列表').optional(),
				completed_at: z.string().describe('任务完成的时间戳(ms)').optional(),
				created_at: z.string().describe('任务创建时间戳(ms)').optional(),
				creator: z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				}).describe('清单所有者').optional(),
				custom_complete: z.looseObject({
					android: z.record(z.string(), z.unknown()).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
					ios: z.record(z.string(), z.unknown()).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
					pc: z.record(z.string(), z.unknown()).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
				}).describe('任务自定义完成配置').optional(),
				custom_fields: z.array(z.looseObject({
					datetime_value: z.string().describe('日期类型自定义字段值').optional(),
					guid: z.string().describe('字段GUID').optional(),
					member_value: z.array(z.unknown()).describe('人员类型的自定义字段值，可以设置1个或多个用户的id（遵循member格式，只支持user类型）').optional(),
					multi_select_value: z.array(z.unknown()).describe('多选类型字段值，可以填写一个或多个本字段的option_guid').optional(),
					name: z.string().describe('自定义字段名').optional(),
					number_value: z.string().describe('数字类型的自定义字段值，填写一个合法数字的字符串表示，空字符串表示设为空').optional(),
					single_select_value: z.string().describe('单选类型字段值，填写一个字段选项的option_guid').optional(),
					text_value: z.string().describe('文本类型字段值').optional(),
					type: z.string().describe('自定义字段类型，支持"member", "datetime", "number", "single_select", "multi_select"五种类型').optional(),
				})).describe('任务的自定义字段值').optional(),
				dependencies: z.array(z.looseObject({
					task_guid: z.string().describe('依赖任务的GUID').optional(),
					type: z.string().describe('依赖类型').optional(),
				})).describe('任务依赖').optional(),
				description: z.string().describe('任务描述').optional(),
				due: z.looseObject({
					is_all_day: z.boolean().describe('是否截止到一个日期').optional(),
					timestamp: z.string().describe('截止时间/日期的时间戳，距1970-01-01 00:00:00 UTC的毫秒数').optional(),
				}).describe('任务截止时间').optional(),
				extra: z.string().describe('任务附带的自定义数据').optional(),
				guid: z.string().describe('任务guid，任务的唯一ID').optional(),
				is_milestone: z.boolean().describe('是否是里程碑任务').optional(),
				members: z.array(z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				})).describe('任务成员列表').optional(),
				mode: z.number().int().describe('任务的模式').optional(),
				next_task_guid: z.string().describe('重复任务的下一个任务').optional(),
				origin: z.looseObject({
					href: z.record(z.string(), z.unknown()).describe('任务关联的来源平台详情页链接').optional(),
					platform_i18n_name: z.record(z.string(), z.unknown()).describe('自定义完成的弹出提示').optional(),
				}).describe('任务关联的第三方平台来源信息').optional(),
				parent_task_guid: z.string().describe('如果当前任务为某个任务的子任务，返回父任务的guid').optional(),
				positive_reminders: z.array(z.looseObject({
					id: z.string().describe('提醒时间设置的 ID').optional(),
					relative_fire_minute: z.number().int().describe('相对于截止时间的提醒时间分钟数').optional(),
				})).describe('正数协议任务提醒').optional(),
				reminders: z.array(z.looseObject({
					id: z.string().describe('提醒时间设置的 ID').optional(),
					relative_fire_minute: z.number().int().describe('相对于截止时间的提醒时间分钟数').optional(),
				})).describe('任务的提醒配置列表').optional(),
				repeat_rule: z.string().describe('如果设置，则该任务为“重复任务”').optional(),
				source: z.number().int().describe('任务创建的来源').optional(),
				start: z.looseObject({
					is_all_day: z.boolean().describe('是否开始于一个日期').optional(),
					timestamp: z.string().describe('开始时间/日期的时间戳，距1970-01-01 00:00:00的毫秒数').optional(),
				}).describe('任务的开始时间(ms)').optional(),
				status: z.string().describe('任务的状态，支持"todo"和"done"两种状态').optional(),
				subtask_count: z.number().int().describe('该任务的子任务的个数').optional(),
				summary: z.string().describe('任务标题').optional(),
				task_id: z.string().describe('任务界面上的代码').optional(),
				tasklists: z.array(z.looseObject({
					section_guid: z.string().describe('任务所在清单的自定义分组guid').optional(),
					tasklist_guid: z.string().describe('任务所在清单的guid').optional(),
				})).describe('任务所属清单的名字').optional(),
				text_deliveries: z.array(z.unknown()).describe('智能体文本类交付物').optional(),
				updated_at: z.string().describe('任务最后一次更新的时间戳(ms)').optional(),
				url: z.string().describe('任务的分享链接').optional(),
			})).describe('子任务列表').optional(),
			page_token: z.string().describe('用于返回下一个分页的token').optional(),
		}),
	},
	'task.tasklists.add_members': {
		pathParams: z.strictObject({
			tasklist_guid: z.union([z.string(), z.number().transform(String)]).describe('要添加成员的清单的全局唯一ID'),
		}),
		query: z.looseObject({
			user_id_type: z.string().describe('表示user的ID的类型，支持open_id, user_id, union_id').optional(),
		}),
		body: z.looseObject({
			members: z.array(z.looseObject({
				id: z.string().describe('表示member的id').optional(),
				name: z.string().describe('成员名称').optional(),
				role: z.string().describe('成员角色').optional(),
				type: z.string().describe('成员的类型').optional(),
			})).describe('要添加的成员列表'),
		}),
		response: z.looseObject({
			tasklist: z.looseObject({
				archive_msec: z.string().describe('清单归档时间戳(ms)').optional(),
				created_at: z.string().describe('清单创建时间戳(ms)').optional(),
				creator: z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				}).describe('清单所有者').optional(),
				guid: z.string().describe('清单的全局唯一ID').optional(),
				members: z.array(z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				})).describe('清单协作人').optional(),
				name: z.string().describe('清单名称').optional(),
				owner: z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				}).describe('清单所有者').optional(),
				updated_at: z.string().describe('清单最后一次更新时间戳（ms)').optional(),
				url: z.string().describe('该清单分享的applink').optional(),
			}).describe('完成更新后的清单实体').optional(),
		}),
	},
	'task.tasklists.create': {
		query: z.looseObject({
			user_id_type: z.string().describe('表示user的ID的类型，支持open_id, user_id, union_id').optional(),
		}),
		body: z.looseObject({
			archive_tasklist: z.boolean().describe('是否归档清单').optional(),
			members: z.array(z.looseObject({
				id: z.string().describe('表示member的id').optional(),
				name: z.string().describe('成员名称').optional(),
				role: z.string().describe('成员角色').optional(),
				type: z.string().describe('成员的类型').optional(),
			})).describe('清单的成员列表').optional(),
			name: z.string().describe('清单名称，必填'),
		}),
		response: z.looseObject({
			tasklist: z.looseObject({
				archive_msec: z.string().describe('清单归档时间戳(ms)').optional(),
				created_at: z.string().describe('清单创建时间戳(ms)').optional(),
				creator: z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				}).describe('清单所有者').optional(),
				guid: z.string().describe('清单的全局唯一ID').optional(),
				members: z.array(z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				})).describe('清单协作人').optional(),
				name: z.string().describe('清单名称').optional(),
				owner: z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				}).describe('清单所有者').optional(),
				updated_at: z.string().describe('清单最后一次更新时间戳（ms)').optional(),
				url: z.string().describe('该清单分享的applink').optional(),
			}).describe('创建的清单数据').optional(),
		}),
	},
	'task.tasklists.delete': {
		pathParams: z.strictObject({
			tasklist_guid: z.union([z.string(), z.number().transform(String)]).describe('要删除的清单GUID'),
		}),
	},
	'task.tasklists.get': {
		pathParams: z.strictObject({
			tasklist_guid: z.union([z.string(), z.number().transform(String)]).describe('清单全局唯一GUID'),
		}),
		query: z.looseObject({
			user_id_type: z.string().describe('表示user的ID的类型，支持open_id, user_id, union_id').optional(),
		}),
		response: z.looseObject({
			tasklist: z.looseObject({
				archive_msec: z.string().describe('清单归档时间戳(ms)').optional(),
				created_at: z.string().describe('清单创建时间戳(ms)').optional(),
				creator: z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				}).describe('清单所有者').optional(),
				guid: z.string().describe('清单的全局唯一ID').optional(),
				members: z.array(z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				})).describe('清单协作人').optional(),
				name: z.string().describe('清单名称').optional(),
				owner: z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				}).describe('清单所有者').optional(),
				updated_at: z.string().describe('清单最后一次更新时间戳（ms)').optional(),
				url: z.string().describe('该清单分享的applink').optional(),
			}).describe('清单详情').optional(),
		}),
	},
	'task.tasklists.list': {
		query: z.looseObject({
			page_size: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('每页返回的清单数量').optional(),
			page_token: z.string().describe('分页标记，第一次请求不填，表示从头开始遍历').optional(),
			user_id_type: z.string().describe('表示user的ID的类型，支持open_id, user_id, union_id').optional(),
		}),
		response: z.looseObject({
			has_more: z.boolean().describe('是否还有更多项').optional(),
			items: z.array(z.looseObject({
				archive_msec: z.string().describe('清单归档时间戳(ms)').optional(),
				created_at: z.string().describe('清单创建时间戳(ms)').optional(),
				creator: z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				}).describe('清单所有者').optional(),
				guid: z.string().describe('清单的全局唯一ID').optional(),
				members: z.array(z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				})).describe('清单协作人').optional(),
				name: z.string().describe('清单名称').optional(),
				owner: z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				}).describe('清单所有者').optional(),
				updated_at: z.string().describe('清单最后一次更新时间戳（ms)').optional(),
				url: z.string().describe('该清单分享的applink').optional(),
			})).describe('清单数据列表').optional(),
			page_token: z.string().describe('用于获取下一页的分页标记').optional(),
		}),
	},
	'task.tasklists.patch': {
		pathParams: z.strictObject({
			tasklist_guid: z.union([z.string(), z.number().transform(String)]).describe('要更新的清单的全局唯一GUID'),
		}),
		query: z.looseObject({
			user_id_type: z.string().describe('表示user的ID的类型，支持open_id, user_id, union_id').optional(),
		}),
		body: z.looseObject({
			origin_owner_to_role: z.enum(['editor', 'viewer', 'none']).describe('该字段表示如果更新了新的所有者，则将原所有者设为指定的新的角色').optional(),
			tasklist: z.looseObject({
				archive_tasklist: z.boolean().describe('是否归档清单').optional(),
				name: z.string().describe('清单名称，必填').optional(),
				owner: z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				}).describe('清单所有者').optional(),
			}),
			update_fields: z.array(z.unknown()).describe('要更新的字段名，支持;<md-enum>;<md-enum-item key="name" >更新清单名</md-enum-item>;<md-enum-item key="owner" >更新清单所有者</md-enum-item>;<…'),
		}),
		response: z.looseObject({
			tasklist: z.looseObject({
				archive_msec: z.string().describe('清单归档时间戳(ms)').optional(),
				created_at: z.string().describe('清单创建时间戳(ms)').optional(),
				creator: z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				}).describe('清单所有者').optional(),
				guid: z.string().describe('清单的全局唯一ID').optional(),
				members: z.array(z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				})).describe('清单协作人').optional(),
				name: z.string().describe('清单名称').optional(),
				owner: z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				}).describe('清单所有者').optional(),
				updated_at: z.string().describe('清单最后一次更新时间戳（ms)').optional(),
				url: z.string().describe('该清单分享的applink').optional(),
			}).describe('修改后的任务清单').optional(),
		}),
	},
	'task.tasklists.remove_members': {
		pathParams: z.strictObject({
			tasklist_guid: z.union([z.string(), z.number().transform(String)]).describe('要移除协作人的清单全局唯一ID'),
		}),
		query: z.looseObject({
			user_id_type: z.string().describe('表示user的ID的类型，支持open_id, user_id, union_id').optional(),
		}),
		body: z.looseObject({
			members: z.array(z.looseObject({
				id: z.string().describe('表示member的id').optional(),
				name: z.string().describe('成员名称').optional(),
				role: z.string().describe('成员角色').optional(),
				type: z.string().describe('成员的类型').optional(),
			})).describe('要移除的member列表'),
		}),
		response: z.looseObject({
			tasklist: z.looseObject({
				archive_msec: z.string().describe('清单归档时间戳(ms)').optional(),
				created_at: z.string().describe('清单创建时间戳(ms)').optional(),
				creator: z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				}).describe('清单所有者').optional(),
				guid: z.string().describe('清单的全局唯一ID').optional(),
				members: z.array(z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				})).describe('清单协作人').optional(),
				name: z.string().describe('清单名称').optional(),
				owner: z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				}).describe('清单所有者').optional(),
				updated_at: z.string().describe('清单最后一次更新时间戳（ms)').optional(),
				url: z.string().describe('该清单分享的applink').optional(),
			}).describe('修改完成后的清单实体').optional(),
		}),
	},
	'task.tasklists.tasks': {
		pathParams: z.strictObject({
			tasklist_guid: z.union([z.string(), z.number().transform(String)]).describe('要获取任务的清单全局唯一ID'),
		}),
		query: z.looseObject({
			completed: z.union([z.boolean(), z.stringbool()]).describe('只查看特定完成状态的任务，填写“true”表示返回已经完成的任务').optional(),
			created_from: z.string().describe('任务创建的起始时间戳（ms），闭区间，不填写默认为首个任务的创建时间戳').optional(),
			created_to: z.string().describe('任务创建的结束时间戳（ms），闭区间，不填写默认为最后创建任务的创建时间戳').optional(),
			page_size: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('每页返回的任务数量').optional(),
			page_token: z.string().describe('分页标记，第一次请求不填，表示从头开始遍历').optional(),
			user_id_type: z.string().describe('表示user的ID的类型，支持open_id, user_id, union_id').optional(),
		}),
		response: z.looseObject({
			has_more: z.boolean().describe('是否还有更多项').optional(),
			items: z.array(z.looseObject({
				completed_at: z.string().describe('任务完成的时间戳(ms)，为0表示未完成').optional(),
				due: z.looseObject({
					is_all_day: z.boolean().describe('是否截止到一个日期').optional(),
					timestamp: z.string().describe('截止时间/日期的时间戳，距1970-01-01 00:00:00 UTC的毫秒数').optional(),
				}).describe('任务截止时间').optional(),
				guid: z.string().describe('任务GUID').optional(),
				members: z.array(z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				})).describe('任务成员列表').optional(),
				start: z.looseObject({
					is_all_day: z.boolean().describe('是否开始于一个日期').optional(),
					timestamp: z.string().describe('开始时间/日期的时间戳，距1970-01-01 00:00:00的毫秒数').optional(),
				}).describe('任务开始时间').optional(),
				subtask_count: z.number().int().describe('子任务的个数').optional(),
				summary: z.string().describe('任务标题').optional(),
			})).describe('任务摘要数据').optional(),
			page_token: z.string().describe('用于获取下一页的分页标记，最后一页时发返回空').optional(),
		}),
	},
	'task.tasks.create': {
		query: z.looseObject({
			user_id_type: z.string().describe('表示user的ID的类型，支持open_id, user_id, union_id').optional(),
		}),
		body: z.looseObject({
			agent_task_progress: z.string().describe('智能体任务进度').optional(),
			agent_task_status: z.number().int().describe('智能体任务状态').optional(),
			client_token: z.string().describe('幂等token，如果填写则触发幂等行为').optional(),
			completed_at: z.string().describe('任务的完成时刻时间戳(ms)').optional(),
			custom_complete: z.looseObject({
				android: z.looseObject({
					href: z.string().describe('自定义完成的跳转url').optional(),
					tip: z.record(z.string(), z.unknown()).describe('自定义完成的弹出提示').optional(),
				}).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
				ios: z.looseObject({
					href: z.string().describe('自定义完成的跳转url').optional(),
					tip: z.record(z.string(), z.unknown()).describe('自定义完成的弹出提示').optional(),
				}).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
				pc: z.looseObject({
					href: z.string().describe('自定义完成的跳转url').optional(),
					tip: z.record(z.string(), z.unknown()).describe('自定义完成的弹出提示').optional(),
				}).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
			}).describe('如果设置，则将任务设计为“自定义完成”').optional(),
			custom_fields: z.array(z.looseObject({
				datetime_value: z.string().describe('日期类型自定义字段值，可以输入一个表示日期的以毫秒为单位的字符串').optional(),
				guid: z.string().describe('自定义字段guid'),
				member_value: z.array(z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					type: z.string().describe('成员的类型').optional(),
				})).describe('人员类型的自定义字段值').optional(),
				multi_select_value: z.array(z.unknown()).describe('多选类型字段值，可以填写一个或多个本字段的option_guid').optional(),
				number_value: z.string().describe('数字类型的自定义字段值，填写一个合法数字的字符串表示，空字符串表示设为空').optional(),
				single_select_value: z.string().describe('单选类型字段值，填写一个字段选项的option_guid').optional(),
				text_value: z.string().describe('文本类型字段值').optional(),
			})).describe('自定义字段值').optional(),
			description: z.string().describe('任务描述').optional(),
			docx_source: z.looseObject({
				block_id: z.string().describe('任务关联的文档block_id，要求block_id存在于token对应文档中、且block_id没有绑定过其他的任务'),
				token: z.string().describe('任务关联的文档token，要求：如果使用tenant_access_token请求，则请求机器人有文档编辑权限'),
			}).describe('任务的新版云文档来源').optional(),
			due: z.looseObject({
				is_all_day: z.boolean().describe('是否截止到一个日期').optional(),
				timestamp: z.string().describe('截止时间/日期的时间戳，距1970-01-01 00:00:00 UTC的毫秒数').optional(),
			}).describe('任务截止时间戳(ms)，截止时间戳和截止日期选择一个填写').optional(),
			extra: z.string().describe('调用者可以传入的任意附带到任务上的数据').optional(),
			is_milestone: z.boolean().describe('是否是里程碑任务').optional(),
			members: z.array(z.looseObject({
				id: z.string().describe('表示member的id'),
				name: z.string().describe('成员名称').optional(),
				role: z.string().describe('成员角色，可以是"assignee"或者"follower"'),
				type: z.string().describe('成员的类型').optional(),
			})).describe('任务成员列表，包括负责人和关注人').optional(),
			mode: z.number().int().describe('任务完成模式, 1 - 会签任务').optional(),
			origin: z.looseObject({
				href: z.looseObject({
					title: z.string().describe('链接对应的标题').optional(),
					url: z.string().describe('链接对应的地址').optional(),
				}).describe('任务关联的来源平台详情页链接').optional(),
				platform_i18n_name: z.looseObject({
					de_de: z.string().describe('德语').optional(),
					en_us: z.string().describe('英文').optional(),
					es_es: z.string().describe('西班牙语').optional(),
					fr_fr: z.string().describe('法语').optional(),
					it_it: z.string().describe('意大利语').optional(),
					ja_jp: z.string().describe('日语').optional(),
					ko_kr: z.string().describe('韩语').optional(),
					ru_ru: z.string().describe('俄语').optional(),
					th_th: z.string().describe('泰语').optional(),
					zh_cn: z.string().describe('中文').optional(),
					zh_hk: z.string().describe('中文（中国香港）').optional(),
					zh_tw: z.string().describe('中文（中国台湾）').optional(),
				}).describe('自定义完成的弹出提示').optional(),
			}).describe('任务关联的第三方平台来源信息').optional(),
			positive_reminders: z.array(z.looseObject({
				relative_fire_minute: z.number().int().describe('相对于截止时间的提醒时间分钟数'),
			})).describe('正数协议每日提醒').optional(),
			reminders: z.array(z.looseObject({
				relative_fire_minute: z.number().int().describe('相对于截止时间的提醒时间分钟数'),
			})).describe('任务提醒').optional(),
			repeat_rule: z.string().describe('如果设置，则该任务为“重复任务”').optional(),
			start: z.looseObject({
				is_all_day: z.boolean().describe('是否开始于一个日期').optional(),
				timestamp: z.string().describe('开始时间/日期的时间戳，距1970-01-01 00:00:00的毫秒数').optional(),
			}).describe('任务的开始时间(ms)').optional(),
			summary: z.string().describe('任务标题'),
			tasklists: z.array(z.looseObject({
				section_guid: z.string().describe('任务所在清单的自定义分组guid').optional(),
				tasklist_guid: z.string().describe('任务所在清单的guid').optional(),
			})).describe('任务所在清单的信息').optional(),
			text_deliveries: z.array(z.unknown()).describe('智能体文本类交付物').optional(),
		}),
		response: z.looseObject({
			task: z.looseObject({
				agent_task_progress: z.string().describe('智能体任务进度').optional(),
				agent_task_status: z.number().int().describe('智能体任务状态').optional(),
				assignee_related: z.array(z.looseObject({
					completed_at: z.string().describe('会签任务中执行者完成的时间戳(ms)').optional(),
					id: z.string().describe('任务执行者的id').optional(),
				})).describe('任务执行者相关信息，如会签任务各执行者完成时间等').optional(),
				attachment_deliveries: z.array(z.looseObject({
					file_token: z.string().describe('附件在云文档系统中的token').optional(),
					guid: z.string().describe('附件guid').optional(),
					is_cover: z.boolean().describe('是否是封面图').optional(),
					name: z.string().describe('附件名').optional(),
					resource: z.record(z.string(), z.unknown()).describe('附件归属的资源').optional(),
					size: z.number().int().describe('附件的字节大小').optional(),
					uploaded_at: z.string().describe('上传时间戳(ms)').optional(),
					uploader: z.record(z.string(), z.unknown()).describe('清单所有者').optional(),
					url: z.string().describe('附件的临时下载url，有效时间3分钟，且只允许调用3次进行附件下载').optional(),
				})).describe('智能体附件类交付物').optional(),
				attachments: z.array(z.looseObject({
					file_token: z.string().describe('附件在云文档系统中的token').optional(),
					guid: z.string().describe('附件guid').optional(),
					is_cover: z.boolean().describe('是否是封面图').optional(),
					name: z.string().describe('附件名').optional(),
					resource: z.record(z.string(), z.unknown()).describe('附件归属的资源').optional(),
					size: z.number().int().describe('附件的字节大小').optional(),
					uploaded_at: z.string().describe('上传时间戳(ms)').optional(),
					uploader: z.record(z.string(), z.unknown()).describe('清单所有者').optional(),
				})).describe('任务的附件列表').optional(),
				completed_at: z.string().describe('任务完成的时间戳(ms)').optional(),
				created_at: z.string().describe('任务创建时间戳(ms)').optional(),
				creator: z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				}).describe('清单所有者').optional(),
				custom_complete: z.looseObject({
					android: z.record(z.string(), z.unknown()).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
					ios: z.record(z.string(), z.unknown()).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
					pc: z.record(z.string(), z.unknown()).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
				}).describe('任务自定义完成配置').optional(),
				custom_fields: z.array(z.looseObject({
					datetime_value: z.string().describe('日期类型自定义字段值').optional(),
					guid: z.string().describe('字段GUID').optional(),
					member_value: z.array(z.unknown()).describe('人员类型的自定义字段值，可以设置1个或多个用户的id（遵循member格式，只支持user类型）').optional(),
					multi_select_value: z.array(z.unknown()).describe('多选类型字段值，可以填写一个或多个本字段的option_guid').optional(),
					name: z.string().describe('自定义字段名').optional(),
					number_value: z.string().describe('数字类型的自定义字段值，填写一个合法数字的字符串表示，空字符串表示设为空').optional(),
					single_select_value: z.string().describe('单选类型字段值，填写一个字段选项的option_guid').optional(),
					text_value: z.string().describe('文本类型字段值').optional(),
					type: z.string().describe('自定义字段类型，支持"member", "datetime", "number", "single_select", "multi_select"五种类型').optional(),
				})).describe('任务的自定义字段值').optional(),
				dependencies: z.array(z.looseObject({
					task_guid: z.string().describe('依赖任务的GUID').optional(),
					type: z.string().describe('依赖类型').optional(),
				})).describe('任务依赖').optional(),
				description: z.string().describe('任务描述').optional(),
				due: z.looseObject({
					is_all_day: z.boolean().describe('是否截止到一个日期').optional(),
					timestamp: z.string().describe('截止时间/日期的时间戳，距1970-01-01 00:00:00 UTC的毫秒数').optional(),
				}).describe('任务截止时间').optional(),
				extra: z.string().describe('任务附带的自定义数据').optional(),
				guid: z.string().describe('任务guid，任务的唯一ID').optional(),
				is_milestone: z.boolean().describe('是否是里程碑任务').optional(),
				members: z.array(z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				})).describe('任务成员列表').optional(),
				mode: z.number().int().describe('任务的模式').optional(),
				next_task_guid: z.string().describe('重复任务的下一个任务').optional(),
				origin: z.looseObject({
					href: z.record(z.string(), z.unknown()).describe('任务关联的来源平台详情页链接').optional(),
					platform_i18n_name: z.record(z.string(), z.unknown()).describe('自定义完成的弹出提示').optional(),
				}).describe('任务关联的第三方平台来源信息').optional(),
				parent_task_guid: z.string().describe('如果当前任务为某个任务的子任务，返回父任务的guid').optional(),
				positive_reminders: z.array(z.looseObject({
					id: z.string().describe('提醒时间设置的 ID').optional(),
					relative_fire_minute: z.number().int().describe('相对于截止时间的提醒时间分钟数').optional(),
				})).describe('正数协议任务提醒').optional(),
				reminders: z.array(z.looseObject({
					id: z.string().describe('提醒时间设置的 ID').optional(),
					relative_fire_minute: z.number().int().describe('相对于截止时间的提醒时间分钟数').optional(),
				})).describe('任务的提醒配置列表').optional(),
				repeat_rule: z.string().describe('如果设置，则该任务为“重复任务”').optional(),
				source: z.number().int().describe('任务创建的来源').optional(),
				start: z.looseObject({
					is_all_day: z.boolean().describe('是否开始于一个日期').optional(),
					timestamp: z.string().describe('开始时间/日期的时间戳，距1970-01-01 00:00:00的毫秒数').optional(),
				}).describe('任务的开始时间(ms)').optional(),
				status: z.string().describe('任务的状态，支持"todo"和"done"两种状态').optional(),
				subtask_count: z.number().int().describe('该任务的子任务的个数').optional(),
				summary: z.string().describe('任务标题').optional(),
				task_id: z.string().describe('任务界面上的代码').optional(),
				tasklists: z.array(z.looseObject({
					section_guid: z.string().describe('任务所在清单的自定义分组guid').optional(),
					tasklist_guid: z.string().describe('任务所在清单的guid').optional(),
				})).describe('任务所属清单的名字').optional(),
				text_deliveries: z.array(z.unknown()).describe('智能体文本类交付物').optional(),
				updated_at: z.string().describe('任务最后一次更新的时间戳(ms)').optional(),
				url: z.string().describe('任务的分享链接').optional(),
			}).describe('产生的任务').optional(),
		}),
	},
	'task.tasks.delete': {
		pathParams: z.strictObject({
			task_guid: z.union([z.string(), z.number().transform(String)]).describe('要删除的任务guid'),
		}),
	},
	'task.tasks.get': {
		pathParams: z.strictObject({
			task_guid: z.union([z.string(), z.number().transform(String)]).describe('要获取的任务guid'),
		}),
		query: z.looseObject({
			user_id_type: z.string().describe('表示user的ID的类型，支持open_id, user_id, union_id').optional(),
		}),
		response: z.looseObject({
			task: z.looseObject({
				agent_task_progress: z.string().describe('智能体任务进度').optional(),
				agent_task_status: z.number().int().describe('智能体任务状态').optional(),
				assignee_related: z.array(z.looseObject({
					completed_at: z.string().describe('会签任务中执行者完成的时间戳(ms)').optional(),
					id: z.string().describe('任务执行者的id').optional(),
				})).describe('任务执行者相关信息，如会签任务各执行者完成时间等').optional(),
				attachment_deliveries: z.array(z.looseObject({
					file_token: z.string().describe('附件在云文档系统中的token').optional(),
					guid: z.string().describe('附件guid').optional(),
					is_cover: z.boolean().describe('是否是封面图').optional(),
					name: z.string().describe('附件名').optional(),
					resource: z.record(z.string(), z.unknown()).describe('附件归属的资源').optional(),
					size: z.number().int().describe('附件的字节大小').optional(),
					uploaded_at: z.string().describe('上传时间戳(ms)').optional(),
					uploader: z.record(z.string(), z.unknown()).describe('清单所有者').optional(),
					url: z.string().describe('附件的临时下载url，有效时间3分钟，且只允许调用3次进行附件下载').optional(),
				})).describe('智能体附件类交付物').optional(),
				attachments: z.array(z.looseObject({
					file_token: z.string().describe('附件在云文档系统中的token').optional(),
					guid: z.string().describe('附件guid').optional(),
					is_cover: z.boolean().describe('是否是封面图').optional(),
					name: z.string().describe('附件名').optional(),
					resource: z.record(z.string(), z.unknown()).describe('附件归属的资源').optional(),
					size: z.number().int().describe('附件的字节大小').optional(),
					uploaded_at: z.string().describe('上传时间戳(ms)').optional(),
					uploader: z.record(z.string(), z.unknown()).describe('清单所有者').optional(),
				})).describe('任务的附件列表').optional(),
				completed_at: z.string().describe('任务完成的时间戳(ms)').optional(),
				created_at: z.string().describe('任务创建时间戳(ms)').optional(),
				creator: z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				}).describe('清单所有者').optional(),
				custom_complete: z.looseObject({
					android: z.record(z.string(), z.unknown()).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
					ios: z.record(z.string(), z.unknown()).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
					pc: z.record(z.string(), z.unknown()).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
				}).describe('任务自定义完成配置').optional(),
				custom_fields: z.array(z.looseObject({
					datetime_value: z.string().describe('日期类型自定义字段值').optional(),
					guid: z.string().describe('字段GUID').optional(),
					member_value: z.array(z.unknown()).describe('人员类型的自定义字段值，可以设置1个或多个用户的id（遵循member格式，只支持user类型）').optional(),
					multi_select_value: z.array(z.unknown()).describe('多选类型字段值，可以填写一个或多个本字段的option_guid').optional(),
					name: z.string().describe('自定义字段名').optional(),
					number_value: z.string().describe('数字类型的自定义字段值，填写一个合法数字的字符串表示，空字符串表示设为空').optional(),
					single_select_value: z.string().describe('单选类型字段值，填写一个字段选项的option_guid').optional(),
					text_value: z.string().describe('文本类型字段值').optional(),
					type: z.string().describe('自定义字段类型，支持"member", "datetime", "number", "single_select", "multi_select"五种类型').optional(),
				})).describe('任务的自定义字段值').optional(),
				dependencies: z.array(z.looseObject({
					task_guid: z.string().describe('依赖任务的GUID').optional(),
					type: z.string().describe('依赖类型').optional(),
				})).describe('任务依赖').optional(),
				description: z.string().describe('任务描述').optional(),
				due: z.looseObject({
					is_all_day: z.boolean().describe('是否截止到一个日期').optional(),
					timestamp: z.string().describe('截止时间/日期的时间戳，距1970-01-01 00:00:00 UTC的毫秒数').optional(),
				}).describe('任务截止时间').optional(),
				extra: z.string().describe('任务附带的自定义数据').optional(),
				guid: z.string().describe('任务guid，任务的唯一ID').optional(),
				is_milestone: z.boolean().describe('是否是里程碑任务').optional(),
				members: z.array(z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				})).describe('任务成员列表').optional(),
				mode: z.number().int().describe('任务的模式').optional(),
				next_task_guid: z.string().describe('重复任务的下一个任务').optional(),
				origin: z.looseObject({
					href: z.record(z.string(), z.unknown()).describe('任务关联的来源平台详情页链接').optional(),
					platform_i18n_name: z.record(z.string(), z.unknown()).describe('自定义完成的弹出提示').optional(),
				}).describe('任务关联的第三方平台来源信息').optional(),
				parent_task_guid: z.string().describe('如果当前任务为某个任务的子任务，返回父任务的guid').optional(),
				positive_reminders: z.array(z.looseObject({
					id: z.string().describe('提醒时间设置的 ID').optional(),
					relative_fire_minute: z.number().int().describe('相对于截止时间的提醒时间分钟数').optional(),
				})).describe('正数协议任务提醒').optional(),
				reminders: z.array(z.looseObject({
					id: z.string().describe('提醒时间设置的 ID').optional(),
					relative_fire_minute: z.number().int().describe('相对于截止时间的提醒时间分钟数').optional(),
				})).describe('任务的提醒配置列表').optional(),
				repeat_rule: z.string().describe('如果设置，则该任务为“重复任务”').optional(),
				source: z.number().int().describe('任务创建的来源').optional(),
				start: z.looseObject({
					is_all_day: z.boolean().describe('是否开始于一个日期').optional(),
					timestamp: z.string().describe('开始时间/日期的时间戳，距1970-01-01 00:00:00的毫秒数').optional(),
				}).describe('任务的开始时间(ms)').optional(),
				status: z.string().describe('任务的状态，支持"todo"和"done"两种状态').optional(),
				subtask_count: z.number().int().describe('该任务的子任务的个数').optional(),
				summary: z.string().describe('任务标题').optional(),
				task_id: z.string().describe('任务界面上的代码').optional(),
				tasklists: z.array(z.looseObject({
					section_guid: z.string().describe('任务所在清单的自定义分组guid').optional(),
					tasklist_guid: z.string().describe('任务所在清单的guid').optional(),
				})).describe('任务所属清单的名字').optional(),
				text_deliveries: z.array(z.unknown()).describe('智能体文本类交付物').optional(),
				updated_at: z.string().describe('任务最后一次更新的时间戳(ms)').optional(),
				url: z.string().describe('任务的分享链接').optional(),
			}).describe('获得的任务实体').optional(),
		}),
	},
	'task.tasks.list': {
		query: z.looseObject({
			agent_task_status: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('智能体任务状态，优先使用completed字段，如果要查细分状态，再使用agent_task_status').optional(),
			completed: z.union([z.boolean(), z.stringbool()]).describe('是否按任务完成进行过滤').optional(),
			page_size: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('每页的任务数量').optional(),
			page_token: z.string().describe('分页标记').optional(),
			type: z.string().describe('列取任务的类型，目前只支持"my_tasks"，即“我负责的”').optional(),
			user_id_type: z.string().describe('表示user的ID的类型，支持open_id, user_id, union_id').optional(),
		}),
		response: z.looseObject({
			has_more: z.boolean().describe('是否还有更多项').optional(),
			items: z.array(z.looseObject({
				agent_task_progress: z.string().describe('智能体任务进度').optional(),
				agent_task_status: z.number().int().describe('智能体任务状态').optional(),
				assignee_related: z.array(z.looseObject({
					completed_at: z.string().describe('会签任务中执行者完成的时间戳(ms)').optional(),
					id: z.string().describe('任务执行者的id').optional(),
				})).describe('任务执行者相关信息，如会签任务各执行者完成时间等').optional(),
				attachment_deliveries: z.array(z.looseObject({
					file_token: z.string().describe('附件在云文档系统中的token').optional(),
					guid: z.string().describe('附件guid').optional(),
					is_cover: z.boolean().describe('是否是封面图').optional(),
					name: z.string().describe('附件名').optional(),
					resource: z.record(z.string(), z.unknown()).describe('附件归属的资源').optional(),
					size: z.number().int().describe('附件的字节大小').optional(),
					uploaded_at: z.string().describe('上传时间戳(ms)').optional(),
					uploader: z.record(z.string(), z.unknown()).describe('清单所有者').optional(),
					url: z.string().describe('附件的临时下载url，有效时间3分钟，且只允许调用3次进行附件下载').optional(),
				})).describe('智能体附件类交付物').optional(),
				attachments: z.array(z.looseObject({
					file_token: z.string().describe('附件在云文档系统中的token').optional(),
					guid: z.string().describe('附件guid').optional(),
					is_cover: z.boolean().describe('是否是封面图').optional(),
					name: z.string().describe('附件名').optional(),
					resource: z.record(z.string(), z.unknown()).describe('附件归属的资源').optional(),
					size: z.number().int().describe('附件的字节大小').optional(),
					uploaded_at: z.string().describe('上传时间戳(ms)').optional(),
					uploader: z.record(z.string(), z.unknown()).describe('清单所有者').optional(),
				})).describe('任务的附件列表').optional(),
				completed_at: z.string().describe('任务完成的时间戳(ms)').optional(),
				created_at: z.string().describe('任务创建时间戳(ms)').optional(),
				creator: z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				}).describe('清单所有者').optional(),
				custom_complete: z.looseObject({
					android: z.record(z.string(), z.unknown()).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
					ios: z.record(z.string(), z.unknown()).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
					pc: z.record(z.string(), z.unknown()).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
				}).describe('任务自定义完成配置').optional(),
				custom_fields: z.array(z.looseObject({
					datetime_value: z.string().describe('日期类型自定义字段值').optional(),
					guid: z.string().describe('字段GUID').optional(),
					member_value: z.array(z.unknown()).describe('人员类型的自定义字段值，可以设置1个或多个用户的id（遵循member格式，只支持user类型）').optional(),
					multi_select_value: z.array(z.unknown()).describe('多选类型字段值，可以填写一个或多个本字段的option_guid').optional(),
					name: z.string().describe('自定义字段名').optional(),
					number_value: z.string().describe('数字类型的自定义字段值，填写一个合法数字的字符串表示，空字符串表示设为空').optional(),
					single_select_value: z.string().describe('单选类型字段值，填写一个字段选项的option_guid').optional(),
					text_value: z.string().describe('文本类型字段值').optional(),
					type: z.string().describe('自定义字段类型，支持"member", "datetime", "number", "single_select", "multi_select"五种类型').optional(),
				})).describe('任务的自定义字段值').optional(),
				dependencies: z.array(z.looseObject({
					task_guid: z.string().describe('依赖任务的GUID').optional(),
					type: z.string().describe('依赖类型').optional(),
				})).describe('任务依赖').optional(),
				description: z.string().describe('任务描述').optional(),
				due: z.looseObject({
					is_all_day: z.boolean().describe('是否截止到一个日期').optional(),
					timestamp: z.string().describe('截止时间/日期的时间戳，距1970-01-01 00:00:00 UTC的毫秒数').optional(),
				}).describe('任务截止时间').optional(),
				extra: z.string().describe('任务附带的自定义数据').optional(),
				guid: z.string().describe('任务guid，任务的唯一ID').optional(),
				is_milestone: z.boolean().describe('是否是里程碑任务').optional(),
				members: z.array(z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				})).describe('任务成员列表').optional(),
				mode: z.number().int().describe('任务的模式').optional(),
				next_task_guid: z.string().describe('重复任务的下一个任务').optional(),
				origin: z.looseObject({
					href: z.record(z.string(), z.unknown()).describe('任务关联的来源平台详情页链接').optional(),
					platform_i18n_name: z.record(z.string(), z.unknown()).describe('自定义完成的弹出提示').optional(),
				}).describe('任务关联的第三方平台来源信息').optional(),
				parent_task_guid: z.string().describe('如果当前任务为某个任务的子任务，返回父任务的guid').optional(),
				positive_reminders: z.array(z.looseObject({
					id: z.string().describe('提醒时间设置的 ID').optional(),
					relative_fire_minute: z.number().int().describe('相对于截止时间的提醒时间分钟数').optional(),
				})).describe('正数协议任务提醒').optional(),
				reminders: z.array(z.looseObject({
					id: z.string().describe('提醒时间设置的 ID').optional(),
					relative_fire_minute: z.number().int().describe('相对于截止时间的提醒时间分钟数').optional(),
				})).describe('任务的提醒配置列表').optional(),
				repeat_rule: z.string().describe('如果设置，则该任务为“重复任务”').optional(),
				source: z.number().int().describe('任务创建的来源').optional(),
				start: z.looseObject({
					is_all_day: z.boolean().describe('是否开始于一个日期').optional(),
					timestamp: z.string().describe('开始时间/日期的时间戳，距1970-01-01 00:00:00的毫秒数').optional(),
				}).describe('任务的开始时间(ms)').optional(),
				status: z.string().describe('任务的状态，支持"todo"和"done"两种状态').optional(),
				subtask_count: z.number().int().describe('该任务的子任务的个数').optional(),
				summary: z.string().describe('任务标题').optional(),
				task_id: z.string().describe('任务界面上的代码').optional(),
				tasklists: z.array(z.looseObject({
					section_guid: z.string().describe('任务所在清单的自定义分组guid').optional(),
					tasklist_guid: z.string().describe('任务所在清单的guid').optional(),
				})).describe('任务所属清单的名字').optional(),
				text_deliveries: z.array(z.unknown()).describe('智能体文本类交付物').optional(),
				updated_at: z.string().describe('任务最后一次更新的时间戳(ms)').optional(),
				url: z.string().describe('任务的分享链接').optional(),
			})).describe('返回的任务列表').optional(),
			page_token: z.string().describe('分页标记，当 has_more 为 true 时，会同时返回新的 page_token，否则不返回 page_token').optional(),
		}),
	},
	'task.tasks.patch': {
		pathParams: z.strictObject({
			task_guid: z.union([z.string(), z.number().transform(String)]).describe('要更新的任务全局唯一ID'),
		}),
		query: z.looseObject({
			user_id_type: z.string().describe('表示user的ID的类型，支持open_id, user_id, union_id').optional(),
		}),
		body: z.looseObject({
			task: z.looseObject({
				agent_task_progress: z.string().describe('智能体任务进度').optional(),
				agent_task_status: z.number().int().describe('智能体任务状态').optional(),
				completed_at: z.string().describe('任务的完成时刻时间戳(ms)').optional(),
				custom_complete: z.looseObject({
					android: z.record(z.string(), z.unknown()).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
					ios: z.record(z.string(), z.unknown()).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
					pc: z.record(z.string(), z.unknown()).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
				}).describe('如果设置，则将任务设计为“自定义完成”').optional(),
				custom_fields: z.array(z.looseObject({
					datetime_value: z.string().describe('日期类型自定义字段值，可以输入一个表示日期的以毫秒为单位的字符串').optional(),
					guid: z.string().describe('自定义字段guid'),
					member_value: z.array(z.unknown()).describe('人员类型的自定义字段值').optional(),
					multi_select_value: z.array(z.unknown()).describe('多选类型字段值，可以填写一个或多个本字段的option_guid').optional(),
					number_value: z.string().describe('数字类型的自定义字段值，填写一个合法数字的字符串表示，空字符串表示设为空').optional(),
					single_select_value: z.string().describe('单选类型字段值，填写一个字段选项的option_guid').optional(),
					text_value: z.string().describe('文本类型字段值').optional(),
				})).describe('自定义字段值').optional(),
				description: z.string().describe('任务描述').optional(),
				due: z.looseObject({
					is_all_day: z.boolean().describe('是否截止到一个日期').optional(),
					timestamp: z.string().describe('截止时间/日期的时间戳，距1970-01-01 00:00:00 UTC的毫秒数').optional(),
				}).describe('任务截止时间戳(ms)，截止时间戳和截止日期选择一个填写').optional(),
				extra: z.string().describe('调用者可以传入的任意附带到任务上的数据').optional(),
				is_milestone: z.boolean().describe('是否是里程碑任务').optional(),
				mode: z.number().int().describe('任务的完成模式').optional(),
				positive_reminders: z.array(z.looseObject({
					relative_fire_minute: z.number().int().describe('相对于截止时间的提醒时间分钟数'),
				})).describe('正数协议每日提醒').optional(),
				repeat_rule: z.string().describe('如果设置，则该任务为“重复任务”').optional(),
				start: z.looseObject({
					is_all_day: z.boolean().describe('是否开始于一个日期').optional(),
					timestamp: z.string().describe('开始时间/日期的时间戳，距1970-01-01 00:00:00的毫秒数').optional(),
				}).describe('任务的开始时间(ms)').optional(),
				summary: z.string().describe('任务标题').optional(),
				text_deliveries: z.array(z.unknown()).describe('智能体文本类交付物').optional(),
			}).describe('要更新的任务数据，只需要设置出现在`update_fields`中的字段即可').optional(),
			update_fields: z.array(z.unknown()).describe('设置需要修改的字段;<md-enum>;<md-enum-item key="summary" >任务标题</md-enum-item>;<md-enum-item key="description" >任务描述</md-enum-ite…'),
		}),
		response: z.looseObject({
			task: z.looseObject({
				agent_task_progress: z.string().describe('智能体任务进度').optional(),
				agent_task_status: z.number().int().describe('智能体任务状态').optional(),
				assignee_related: z.array(z.looseObject({
					completed_at: z.string().describe('会签任务中执行者完成的时间戳(ms)').optional(),
					id: z.string().describe('任务执行者的id').optional(),
				})).describe('任务执行者相关信息，如会签任务各执行者完成时间等').optional(),
				attachment_deliveries: z.array(z.looseObject({
					file_token: z.string().describe('附件在云文档系统中的token').optional(),
					guid: z.string().describe('附件guid').optional(),
					is_cover: z.boolean().describe('是否是封面图').optional(),
					name: z.string().describe('附件名').optional(),
					resource: z.record(z.string(), z.unknown()).describe('附件归属的资源').optional(),
					size: z.number().int().describe('附件的字节大小').optional(),
					uploaded_at: z.string().describe('上传时间戳(ms)').optional(),
					uploader: z.record(z.string(), z.unknown()).describe('清单所有者').optional(),
					url: z.string().describe('附件的临时下载url，有效时间3分钟，且只允许调用3次进行附件下载').optional(),
				})).describe('智能体附件类交付物').optional(),
				attachments: z.array(z.looseObject({
					file_token: z.string().describe('附件在云文档系统中的token').optional(),
					guid: z.string().describe('附件guid').optional(),
					is_cover: z.boolean().describe('是否是封面图').optional(),
					name: z.string().describe('附件名').optional(),
					resource: z.record(z.string(), z.unknown()).describe('附件归属的资源').optional(),
					size: z.number().int().describe('附件的字节大小').optional(),
					uploaded_at: z.string().describe('上传时间戳(ms)').optional(),
					uploader: z.record(z.string(), z.unknown()).describe('清单所有者').optional(),
				})).describe('任务的附件列表').optional(),
				completed_at: z.string().describe('任务完成的时间戳(ms)').optional(),
				created_at: z.string().describe('任务创建时间戳(ms)').optional(),
				creator: z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				}).describe('清单所有者').optional(),
				custom_complete: z.looseObject({
					android: z.record(z.string(), z.unknown()).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
					ios: z.record(z.string(), z.unknown()).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
					pc: z.record(z.string(), z.unknown()).describe('PC客户端自定义完成配置（含Mac和Windows）').optional(),
				}).describe('任务自定义完成配置').optional(),
				custom_fields: z.array(z.looseObject({
					datetime_value: z.string().describe('日期类型自定义字段值').optional(),
					guid: z.string().describe('字段GUID').optional(),
					member_value: z.array(z.unknown()).describe('人员类型的自定义字段值，可以设置1个或多个用户的id（遵循member格式，只支持user类型）').optional(),
					multi_select_value: z.array(z.unknown()).describe('多选类型字段值，可以填写一个或多个本字段的option_guid').optional(),
					name: z.string().describe('自定义字段名').optional(),
					number_value: z.string().describe('数字类型的自定义字段值，填写一个合法数字的字符串表示，空字符串表示设为空').optional(),
					single_select_value: z.string().describe('单选类型字段值，填写一个字段选项的option_guid').optional(),
					text_value: z.string().describe('文本类型字段值').optional(),
					type: z.string().describe('自定义字段类型，支持"member", "datetime", "number", "single_select", "multi_select"五种类型').optional(),
				})).describe('任务的自定义字段值').optional(),
				dependencies: z.array(z.looseObject({
					task_guid: z.string().describe('依赖任务的GUID').optional(),
					type: z.string().describe('依赖类型').optional(),
				})).describe('任务依赖').optional(),
				description: z.string().describe('任务描述').optional(),
				due: z.looseObject({
					is_all_day: z.boolean().describe('是否截止到一个日期').optional(),
					timestamp: z.string().describe('截止时间/日期的时间戳，距1970-01-01 00:00:00 UTC的毫秒数').optional(),
				}).describe('任务截止时间').optional(),
				extra: z.string().describe('任务附带的自定义数据').optional(),
				guid: z.string().describe('任务guid，任务的唯一ID').optional(),
				is_milestone: z.boolean().describe('是否是里程碑任务').optional(),
				members: z.array(z.looseObject({
					id: z.string().describe('表示member的id').optional(),
					name: z.string().describe('成员名称').optional(),
					role: z.string().describe('成员角色').optional(),
					type: z.string().describe('成员的类型').optional(),
				})).describe('任务成员列表').optional(),
				mode: z.number().int().describe('任务的模式').optional(),
				next_task_guid: z.string().describe('重复任务的下一个任务').optional(),
				origin: z.looseObject({
					href: z.record(z.string(), z.unknown()).describe('任务关联的来源平台详情页链接').optional(),
					platform_i18n_name: z.record(z.string(), z.unknown()).describe('自定义完成的弹出提示').optional(),
				}).describe('任务关联的第三方平台来源信息').optional(),
				parent_task_guid: z.string().describe('如果当前任务为某个任务的子任务，返回父任务的guid').optional(),
				positive_reminders: z.array(z.looseObject({
					id: z.string().describe('提醒时间设置的 ID').optional(),
					relative_fire_minute: z.number().int().describe('相对于截止时间的提醒时间分钟数').optional(),
				})).describe('正数协议任务提醒').optional(),
				reminders: z.array(z.looseObject({
					id: z.string().describe('提醒时间设置的 ID').optional(),
					relative_fire_minute: z.number().int().describe('相对于截止时间的提醒时间分钟数').optional(),
				})).describe('任务的提醒配置列表').optional(),
				repeat_rule: z.string().describe('如果设置，则该任务为“重复任务”').optional(),
				source: z.number().int().describe('任务创建的来源').optional(),
				start: z.looseObject({
					is_all_day: z.boolean().describe('是否开始于一个日期').optional(),
					timestamp: z.string().describe('开始时间/日期的时间戳，距1970-01-01 00:00:00的毫秒数').optional(),
				}).describe('任务的开始时间(ms)').optional(),
				status: z.string().describe('任务的状态，支持"todo"和"done"两种状态').optional(),
				subtask_count: z.number().int().describe('该任务的子任务的个数').optional(),
				summary: z.string().describe('任务标题').optional(),
				task_id: z.string().describe('任务界面上的代码').optional(),
				tasklists: z.array(z.looseObject({
					section_guid: z.string().describe('任务所在清单的自定义分组guid').optional(),
					tasklist_guid: z.string().describe('任务所在清单的guid').optional(),
				})).describe('任务所属清单的名字').optional(),
				text_deliveries: z.array(z.unknown()).describe('智能体文本类交付物').optional(),
				updated_at: z.string().describe('任务最后一次更新的时间戳(ms)').optional(),
				url: z.string().describe('任务的分享链接').optional(),
			}).describe('更新后的任务').optional(),
		}),
	},
} satisfies Record<string, FeishuApiSchemas>;
