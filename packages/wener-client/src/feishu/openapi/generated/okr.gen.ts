// Generated from larksuite/cli internal/registry/meta_data.json @ b2b43630c560b00b5634e5614826801a94e1ae40 (MIT License, Copyright (c) 2026 Lark Technologies Pte. Ltd.). Do not edit.
// Regenerate: FEISHU_OPENAPI_META=<meta_data.json> FEISHU_OPENAPI_COMMIT=<sha> node --import tsx packages/wener-client/scripts/generate-feishu-openapi.ts
import { z } from 'zod';
import type { FeishuApiSchemas } from '../types';

export const FeishuApiOkr = {
	'okr.alignments.delete': {
		pathParams: z.strictObject({
			alignment_id: z.union([z.string(), z.number().transform(String)]).describe('对齐 ID'),
		}),
		response: z.looseObject({
			alignment_id: z.string().describe('对齐 ID').optional(),
		}),
	},
	'okr.alignments.get': {
		pathParams: z.strictObject({
			alignment_id: z.union([z.string(), z.number().transform(String)]).describe('对齐 ID'),
		}),
		query: z.looseObject({
			department_id_type: z.enum(['department_id', 'open_department_id']).describe('此次调用中使用的部门 ID 的类型').optional(),
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户 ID 的类型').optional(),
		}),
		response: z.looseObject({
			alignment: z.looseObject({
				create_time: z.string().describe('对齐的创建时间，时间戳').optional(),
				from_entity_id: z.string().describe('发起对齐的实体 ID').optional(),
				from_entity_type: z.number().int().describe('发起对齐的实体类型').optional(),
				from_owner: z.looseObject({
					owner_type: z.string().describe('所有者类型').optional(),
					user_id: z.string().describe('员工 ID').optional(),
				}).describe('发起对齐的所有者').optional(),
				id: z.string().describe('对齐的 ID').optional(),
				to_entity_id: z.string().describe('被对齐的实体 ID').optional(),
				to_entity_type: z.number().int().describe('被对齐的实体类型').optional(),
				to_owner: z.looseObject({
					owner_type: z.string().describe('所有者类型').optional(),
					user_id: z.string().describe('员工 ID').optional(),
				}).describe('被对齐的所有者').optional(),
				update_time: z.string().describe('对齐的更新时间，时间戳').optional(),
			}).describe('对齐').optional(),
		}),
	},
	'okr.categories.list': {
		query: z.looseObject({
			owner_type: z.enum(['user', 'department']).describe('分类的所属类型').optional(),
			page_size: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('分页大小，最大 100').optional(),
			page_token: z.string().describe('分页键，首个分页键传入空串').optional(),
		}),
		response: z.looseObject({
			has_more: z.boolean().describe('是否有下一页').optional(),
			items: z.array(z.looseObject({
				category_type: z.string().describe('分类类型').optional(),
				color: z.string().describe('颜色').optional(),
				create_time: z.string().describe('分类的创建时间，时间戳').optional(),
				enabled: z.boolean().describe('是否启用').optional(),
				id: z.string().describe('分类 ID').optional(),
				name: z.looseObject({
					en: z.string().describe('英文名').optional(),
					ja: z.string().describe('日文名').optional(),
					zh: z.string().describe('中文名').optional(),
				}).describe('名称').optional(),
				update_time: z.string().describe('分类的更新时间，时间戳').optional(),
			})).describe('分类列表').optional(),
			page_token: z.string().describe('分页键，下一个分页需传入该键').optional(),
		}),
	},
	'okr.cycle.objectives.create': {
		pathParams: z.strictObject({
			cycle_id: z.union([z.string(), z.number().transform(String)]).describe('用户周期 ID'),
		}),
		query: z.looseObject({
			department_id_type: z.enum(['department_id', 'open_department_id']).describe('此次调用中使用的部门 ID 的类型').optional(),
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户 ID 的类型').optional(),
		}),
		body: z.looseObject({
			category_id: z.string().describe('目标的分类 ID').optional(),
			content: z.looseObject({
				blocks: z.array(z.looseObject({
					block_element_type: z.enum(['paragraph', 'gallery']).describe('文档元素类型').optional(),
					gallery: z.record(z.string(), z.unknown()).describe('图片').optional(),
					paragraph: z.record(z.string(), z.unknown()).describe('文本段落').optional(),
				})).describe('文档结构是按行排列的，每行内容是一个 Block').optional(),
			}).describe('目标的内容').optional(),
			deadline: z.string().describe('目标的截止时间，时间戳').optional(),
			notes: z.looseObject({
				blocks: z.array(z.looseObject({
					block_element_type: z.enum(['paragraph', 'gallery']).describe('文档元素类型').optional(),
					gallery: z.record(z.string(), z.unknown()).describe('图片').optional(),
					paragraph: z.record(z.string(), z.unknown()).describe('文本段落').optional(),
				})).describe('文档结构是按行排列的，每行内容是一个 Block').optional(),
			}).describe('目标的备注').optional(),
			score: z.number().describe('目标的分数：[0,1]，支持一位小数').optional(),
			weight: z.number().describe('目标的权重：[0,1]，支持三位小数').optional(),
		}),
		response: z.looseObject({
			objective_id: z.string().describe('目标 ID').optional(),
		}),
	},
	'okr.cycle.objectives.list': {
		pathParams: z.strictObject({
			cycle_id: z.union([z.string(), z.number().transform(String)]).describe('用户周期 ID'),
		}),
		query: z.looseObject({
			department_id_type: z.enum(['department_id', 'open_department_id']).describe('此次调用中使用的部门 ID 的类型').optional(),
			page_size: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('分页大小，最大 100').optional(),
			page_token: z.string().describe('分页键，首个分页键传入空串').optional(),
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户 ID 的类型').optional(),
		}),
		response: z.looseObject({
			has_more: z.boolean().describe('是否有下一页').optional(),
			items: z.array(z.looseObject({
				category_id: z.string().describe('目标的分类 ID').optional(),
				content: z.looseObject({
					blocks: z.array(z.unknown()).describe('文档结构是按行排列的，每行内容是一个 Block').optional(),
				}).describe('目标的内容').optional(),
				create_time: z.string().describe('目标的创建时间，时间戳').optional(),
				cycle_id: z.string().describe('目标的用户周期 ID').optional(),
				deadline: z.string().describe('目标的截止时间，时间戳').optional(),
				id: z.string().describe('目标的 ID').optional(),
				notes: z.looseObject({
					blocks: z.array(z.unknown()).describe('文档结构是按行排列的，每行内容是一个 Block').optional(),
				}).describe('目标的备注').optional(),
				owner: z.looseObject({
					owner_type: z.string().describe('所有者类型').optional(),
					user_id: z.string().describe('员工 ID').optional(),
				}).describe('所有者').optional(),
				position: z.number().int().describe('目标的序号：从 1 开始计数').optional(),
				score: z.number().describe('目标的分数：[0,1]，支持一位小数').optional(),
				update_time: z.string().describe('目标的更新时间，时间戳').optional(),
				weight: z.number().describe('目标的权重：[0,1]，支持三位小数').optional(),
			})).describe('目标列表').optional(),
			page_token: z.string().describe('分页键，下一个分页需传入该键').optional(),
		}),
	},
	'okr.cycles.list': {
		query: z.looseObject({
			page_size: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('分页大小，最大 100').optional(),
			page_token: z.string().describe('分页键，首个分页键传入空串').optional(),
			user_id: z.string().describe('用户 ID'),
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户 ID 的类型').optional(),
		}),
		response: z.looseObject({
			has_more: z.boolean().describe('是否有下一页').optional(),
			items: z.array(z.looseObject({
				create_time: z.string().describe('用户周期的创建时间，时间戳').optional(),
				cycle_status: z.number().int().describe('用户周期状态').optional(),
				end_time: z.string().describe('周期的结束时间，时间戳').optional(),
				id: z.string().describe('用户周期 ID').optional(),
				owner: z.looseObject({
					owner_type: z.string().describe('所有者类型').optional(),
					user_id: z.string().describe('员工 ID').optional(),
				}).describe('所有者').optional(),
				score: z.number().describe('用户周期的分数：[0,1]，支持一位小数').optional(),
				start_time: z.string().describe('周期的开始时间，时间戳').optional(),
				tenant_cycle_id: z.string().describe('租户周期 ID').optional(),
				update_time: z.string().describe('用户周期的更新时间，时间戳').optional(),
			})).describe('用户周期列表').optional(),
			page_token: z.string().describe('分页键，下一个分页需传入该键').optional(),
		}),
	},
	'okr.cycles.objectives_position': {
		pathParams: z.strictObject({
			cycle_id: z.union([z.string(), z.number().transform(String)]).describe('用户周期 ID'),
		}),
		query: z.looseObject({
			department_id_type: z.enum(['department_id', 'open_department_id']).describe('此次调用中使用的部门 ID 的类型').optional(),
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户 ID 的类型').optional(),
		}),
		body: z.looseObject({
			objective_ids: z.array(z.unknown()).describe('目标 ID 列表，按照序号顺序'),
		}),
		response: z.looseObject({
			items: z.array(z.looseObject({
				category_id: z.string().describe('目标的分类 ID').optional(),
				content: z.looseObject({
					blocks: z.array(z.unknown()).describe('文档结构是按行排列的，每行内容是一个 Block').optional(),
				}).describe('目标的内容').optional(),
				create_time: z.string().describe('目标的创建时间，时间戳').optional(),
				cycle_id: z.string().describe('目标的用户周期 ID').optional(),
				deadline: z.string().describe('目标的截止时间，时间戳').optional(),
				id: z.string().describe('目标的 ID').optional(),
				notes: z.looseObject({
					blocks: z.array(z.unknown()).describe('文档结构是按行排列的，每行内容是一个 Block').optional(),
				}).describe('目标的备注').optional(),
				owner: z.looseObject({
					owner_type: z.string().describe('所有者类型').optional(),
					user_id: z.string().describe('员工 ID').optional(),
				}).describe('所有者').optional(),
				position: z.number().int().describe('目标的序号：从 1 开始计数').optional(),
				score: z.number().describe('目标的分数：[0,1]，支持一位小数').optional(),
				update_time: z.string().describe('目标的更新时间，时间戳').optional(),
				weight: z.number().describe('目标的权重：[0,1]，支持三位小数').optional(),
			})).describe('目标列表').optional(),
		}),
	},
	'okr.cycles.objectives_weight': {
		pathParams: z.strictObject({
			cycle_id: z.union([z.string(), z.number().transform(String)]).describe('用户周期 ID'),
		}),
		query: z.looseObject({
			department_id_type: z.enum(['department_id', 'open_department_id']).describe('此次调用中使用的部门 ID 的类型').optional(),
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户 ID 的类型').optional(),
		}),
		body: z.looseObject({
			objective_weights: z.array(z.looseObject({
				objective_id: z.string().describe('目标 ID'),
				weight: z.number().describe('目标的权重：[0,1]，支持三位小数'),
			})).describe('目标权重列表'),
		}),
		response: z.looseObject({
			items: z.array(z.looseObject({
				category_id: z.string().describe('目标的分类 ID').optional(),
				content: z.looseObject({
					blocks: z.array(z.unknown()).describe('文档结构是按行排列的，每行内容是一个 Block').optional(),
				}).describe('目标的内容').optional(),
				create_time: z.string().describe('目标的创建时间，时间戳').optional(),
				cycle_id: z.string().describe('目标的用户周期 ID').optional(),
				deadline: z.string().describe('目标的截止时间，时间戳').optional(),
				id: z.string().describe('目标的 ID').optional(),
				notes: z.looseObject({
					blocks: z.array(z.unknown()).describe('文档结构是按行排列的，每行内容是一个 Block').optional(),
				}).describe('目标的备注').optional(),
				owner: z.looseObject({
					owner_type: z.string().describe('所有者类型').optional(),
					user_id: z.string().describe('员工 ID').optional(),
				}).describe('所有者').optional(),
				position: z.number().int().describe('目标的序号：从 1 开始计数').optional(),
				score: z.number().describe('目标的分数：[0,1]，支持一位小数').optional(),
				update_time: z.string().describe('目标的更新时间，时间戳').optional(),
				weight: z.number().describe('目标的权重：[0,1]，支持三位小数').optional(),
			})).describe('目标列表').optional(),
		}),
	},
	'okr.indicators.patch': {
		pathParams: z.strictObject({
			indicator_id: z.union([z.string(), z.number().transform(String)]).describe('指标 ID'),
		}),
		query: z.looseObject({
			department_id_type: z.enum(['department_id', 'open_department_id']).describe('此次调用中使用的部门 ID 的类型').optional(),
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户 ID 的类型').optional(),
		}),
		body: z.looseObject({
			current_value: z.number().describe('指标的当前值，不支持基于关键结果进度自动更新的目标修改').optional(),
			current_value_calculate_type: z.union([z.literal(0), z.literal(1), z.literal(2)]).describe('指标的当前值的计算方式，目标仅支持 0、1').optional(),
			indicator_status: z.union([z.literal(-1), z.literal(0), z.literal(1), z.literal(2)]).describe('指标的状态，只支持指标的状态的计算方式为手动更新时修改').optional(),
			start_value: z.number().describe('指标的起始值，不支持目标修改').optional(),
			status_calculate_type: z.union([z.literal(0), z.literal(1), z.literal(2)]).describe('指标的状态的计算方式，目标仅支持 0、1、2').optional(),
			target_value: z.number().describe('指标的目标值，不支持目标修改').optional(),
			unit: z.looseObject({
				unit_type: z.union([z.literal(0), z.literal(1)]).describe('指标的单位类型'),
				unit_value: z.string().describe('指标单位的值'),
			}).describe('指标的单位，不支持目标修改').optional(),
		}),
		response: z.looseObject({
			indicator: z.looseObject({
				create_time: z.string().describe('指标的创建时间，时间戳').optional(),
				current_value: z.number().describe('指标的当前值').optional(),
				current_value_calculate_type: z.number().int().describe('指标的当前值的计算方').optional(),
				entity_id: z.string().describe('指标所属的实体 ID').optional(),
				entity_type: z.number().int().describe('指标所属的实体类型').optional(),
				id: z.string().describe('指标的 ID').optional(),
				indicator_status: z.number().int().describe('指标的状态').optional(),
				owner: z.looseObject({
					owner_type: z.string().describe('所有者类型').optional(),
					user_id: z.string().describe('员工 ID').optional(),
				}).describe('所有者').optional(),
				start_value: z.number().describe('指标的起始值').optional(),
				status_calculate_type: z.number().int().describe('指标的状态的计算方式').optional(),
				target_value: z.number().describe('指标的目标值').optional(),
				unit: z.looseObject({
					unit_type: z.number().int().describe('指标的单位类型').optional(),
					unit_value: z.string().describe('指标单位的值').optional(),
				}).describe('指标的单位').optional(),
				update_time: z.string().describe('指标的更新时间，时间戳').optional(),
			}).describe('指标').optional(),
		}),
	},
	'okr.key_result.indicators.list': {
		pathParams: z.strictObject({
			key_result_id: z.union([z.string(), z.number().transform(String)]).describe('关键结果 ID'),
		}),
		query: z.looseObject({
			department_id_type: z.enum(['department_id', 'open_department_id']).describe('此次调用中使用的部门 ID 的类型').optional(),
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户 ID 的类型').optional(),
		}),
		response: z.looseObject({
			indicator: z.looseObject({
				create_time: z.string().describe('指标的创建时间，时间戳').optional(),
				current_value: z.number().describe('指标的当前值').optional(),
				current_value_calculate_type: z.number().int().describe('指标的当前值的计算方').optional(),
				entity_id: z.string().describe('指标所属的实体 ID').optional(),
				entity_type: z.number().int().describe('指标所属的实体类型').optional(),
				id: z.string().describe('指标的 ID').optional(),
				indicator_status: z.number().int().describe('指标的状态').optional(),
				owner: z.looseObject({
					owner_type: z.string().describe('所有者类型').optional(),
					user_id: z.string().describe('员工 ID').optional(),
				}).describe('所有者').optional(),
				start_value: z.number().describe('指标的起始值').optional(),
				status_calculate_type: z.number().int().describe('指标的状态的计算方式').optional(),
				target_value: z.number().describe('指标的目标值').optional(),
				unit: z.looseObject({
					unit_type: z.number().int().describe('指标的单位类型').optional(),
					unit_value: z.string().describe('指标单位的值').optional(),
				}).describe('指标的单位').optional(),
				update_time: z.string().describe('指标的更新时间，时间戳').optional(),
			}).describe('指标').optional(),
		}),
	},
	'okr.key_results.delete': {
		pathParams: z.strictObject({
			key_result_id: z.union([z.string(), z.number().transform(String)]).describe('关键结果 ID'),
		}),
		response: z.looseObject({
			key_result_id: z.string().describe('关键结果 ID').optional(),
		}),
	},
	'okr.key_results.get': {
		pathParams: z.strictObject({
			key_result_id: z.union([z.string(), z.number().transform(String)]).describe('关键结果 ID'),
		}),
		query: z.looseObject({
			department_id_type: z.enum(['department_id', 'open_department_id']).describe('此次调用中使用的部门 ID 的类型').optional(),
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户 ID 的类型').optional(),
		}),
		response: z.looseObject({
			key_result: z.looseObject({
				content: z.looseObject({
					blocks: z.array(z.unknown()).describe('文档结构是按行排列的，每行内容是一个 Block').optional(),
				}).describe('关键结果的内容').optional(),
				create_time: z.string().describe('关键结果的创建时间，时间戳').optional(),
				deadline: z.string().describe('目标的截止时间，时间戳').optional(),
				id: z.string().describe('关键结果的 ID').optional(),
				objective_id: z.string().describe('关键结果的目标 ID').optional(),
				owner: z.looseObject({
					owner_type: z.string().describe('所有者类型').optional(),
					user_id: z.string().describe('员工 ID').optional(),
				}).describe('所有者').optional(),
				position: z.number().int().describe('关键结果的序号：从 1 开始计数').optional(),
				score: z.number().describe('关键结果的分数：[0,1]，支持一位小数').optional(),
				update_time: z.string().describe('关键结果的修改时间，时间戳').optional(),
				weight: z.number().describe('目标的权重：[0,1]，支持三位小数').optional(),
			}).describe('关键结果').optional(),
		}),
	},
	'okr.key_results.patch': {
		pathParams: z.strictObject({
			key_result_id: z.union([z.string(), z.number().transform(String)]).describe('关键结果 ID'),
		}),
		query: z.looseObject({
			department_id_type: z.enum(['department_id', 'open_department_id']).describe('此次调用中使用的部门 ID 的类型').optional(),
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户 ID 的类型').optional(),
		}),
		body: z.looseObject({
			content: z.looseObject({
				blocks: z.array(z.looseObject({
					block_element_type: z.enum(['paragraph', 'gallery']).describe('文档元素类型').optional(),
					gallery: z.record(z.string(), z.unknown()).describe('图片').optional(),
					paragraph: z.record(z.string(), z.unknown()).describe('文本段落').optional(),
				})).describe('文档结构是按行排列的，每行内容是一个 Block').optional(),
			}).describe('关键结果的内容').optional(),
			deadline: z.string().describe('目标的截止时间，时间戳').optional(),
			score: z.number().describe('关键结果的分数：[0,1]，支持一位小数').optional(),
		}),
		response: z.looseObject({
			key_result: z.looseObject({
				content: z.looseObject({
					blocks: z.array(z.unknown()).describe('文档结构是按行排列的，每行内容是一个 Block').optional(),
				}).describe('关键结果的内容').optional(),
				create_time: z.string().describe('关键结果的创建时间，时间戳').optional(),
				deadline: z.string().describe('目标的截止时间，时间戳').optional(),
				id: z.string().describe('关键结果的 ID').optional(),
				objective_id: z.string().describe('关键结果的目标 ID').optional(),
				owner: z.looseObject({
					owner_type: z.string().describe('所有者类型').optional(),
					user_id: z.string().describe('员工 ID').optional(),
				}).describe('所有者').optional(),
				position: z.number().int().describe('关键结果的序号：从 1 开始计数').optional(),
				score: z.number().describe('关键结果的分数：[0,1]，支持一位小数').optional(),
				update_time: z.string().describe('关键结果的修改时间，时间戳').optional(),
				weight: z.number().describe('目标的权重：[0,1]，支持三位小数').optional(),
			}).describe('关键结果').optional(),
		}),
	},
	'okr.objective.alignments.create': {
		pathParams: z.strictObject({
			objective_id: z.union([z.string(), z.number().transform(String)]).describe('目标 ID'),
		}),
		body: z.looseObject({
			to_entity_id: z.string().describe('被对齐实体 ID'),
			to_entity_type: z.literal(2).describe('被对齐实体类型'),
		}),
		response: z.looseObject({
			alignment_id: z.string().describe('对齐 ID').optional(),
		}),
	},
	'okr.objective.alignments.list': {
		pathParams: z.strictObject({
			objective_id: z.union([z.string(), z.number().transform(String)]).describe('目标 ID'),
		}),
		query: z.looseObject({
			align_type: z.enum(['aligned', 'aligning']).describe('对齐类型').optional(),
			department_id_type: z.enum(['department_id', 'open_department_id']).describe('此次调用中使用的部门 ID 的类型').optional(),
			page_size: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('分页大小，最大 100').optional(),
			page_token: z.string().describe('分页键，首个分页键传入空串').optional(),
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户 ID 的类型').optional(),
		}),
		response: z.looseObject({
			has_more: z.boolean().describe('是否有下一页').optional(),
			items: z.array(z.looseObject({
				create_time: z.string().describe('对齐的创建时间，时间戳').optional(),
				from_entity_id: z.string().describe('发起对齐的实体 ID').optional(),
				from_entity_type: z.number().int().describe('发起对齐的实体类型').optional(),
				from_owner: z.looseObject({
					owner_type: z.string().describe('所有者类型').optional(),
					user_id: z.string().describe('员工 ID').optional(),
				}).describe('发起对齐的所有者').optional(),
				id: z.string().describe('对齐的 ID').optional(),
				to_entity_id: z.string().describe('被对齐的实体 ID').optional(),
				to_entity_type: z.number().int().describe('被对齐的实体类型').optional(),
				to_owner: z.looseObject({
					owner_type: z.string().describe('所有者类型').optional(),
					user_id: z.string().describe('员工 ID').optional(),
				}).describe('被对齐的所有者').optional(),
				update_time: z.string().describe('对齐的更新时间，时间戳').optional(),
			})).describe('对齐列表').optional(),
			page_token: z.string().describe('分页键，下一个分页需传入该键').optional(),
		}),
	},
	'okr.objective.indicators.list': {
		pathParams: z.strictObject({
			objective_id: z.union([z.string(), z.number().transform(String)]).describe('目标 ID'),
		}),
		query: z.looseObject({
			department_id_type: z.enum(['department_id', 'open_department_id']).describe('此次调用中使用的部门 ID 的类型').optional(),
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户 ID 的类型').optional(),
		}),
		response: z.looseObject({
			indicator: z.looseObject({
				create_time: z.string().describe('指标的创建时间，时间戳').optional(),
				current_value: z.number().describe('指标的当前值').optional(),
				current_value_calculate_type: z.number().int().describe('指标的当前值的计算方').optional(),
				entity_id: z.string().describe('指标所属的实体 ID').optional(),
				entity_type: z.number().int().describe('指标所属的实体类型').optional(),
				id: z.string().describe('指标的 ID').optional(),
				indicator_status: z.number().int().describe('指标的状态').optional(),
				owner: z.looseObject({
					owner_type: z.string().describe('所有者类型').optional(),
					user_id: z.string().describe('员工 ID').optional(),
				}).describe('所有者').optional(),
				start_value: z.number().describe('指标的起始值').optional(),
				status_calculate_type: z.number().int().describe('指标的状态的计算方式').optional(),
				target_value: z.number().describe('指标的目标值').optional(),
				unit: z.looseObject({
					unit_type: z.number().int().describe('指标的单位类型').optional(),
					unit_value: z.string().describe('指标单位的值').optional(),
				}).describe('指标的单位').optional(),
				update_time: z.string().describe('指标的更新时间，时间戳').optional(),
			}).describe('指标').optional(),
		}),
	},
	'okr.objective.key_results.create': {
		pathParams: z.strictObject({
			objective_id: z.union([z.string(), z.number().transform(String)]).describe('目标 ID'),
		}),
		query: z.looseObject({
			department_id_type: z.enum(['department_id', 'open_department_id']).describe('此次调用中使用的部门 ID 的类型').optional(),
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户 ID 的类型').optional(),
		}),
		body: z.looseObject({
			content: z.looseObject({
				blocks: z.array(z.looseObject({
					block_element_type: z.enum(['paragraph', 'gallery']).describe('文档元素类型').optional(),
					gallery: z.record(z.string(), z.unknown()).describe('图片').optional(),
					paragraph: z.record(z.string(), z.unknown()).describe('文本段落').optional(),
				})).describe('文档结构是按行排列的，每行内容是一个 Block').optional(),
			}).describe('关键结果的内容').optional(),
			deadline: z.string().describe('关键结果的截止时间').optional(),
			score: z.number().describe('目标的分数：[0,1]，支持一位小数').optional(),
		}),
		response: z.looseObject({
			key_result_id: z.string().describe('关键结果 ID').optional(),
		}),
	},
	'okr.objective.key_results.list': {
		pathParams: z.strictObject({
			objective_id: z.union([z.string(), z.number().transform(String)]).describe('目标'),
		}),
		query: z.looseObject({
			department_id_type: z.enum(['department_id', 'open_department_id']).describe('此次调用中使用的部门 ID 的类型').optional(),
			page_size: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('分页大小，最大 100').optional(),
			page_token: z.string().describe('分页键，首个分页键传入空串').optional(),
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户 ID 的类型').optional(),
		}),
		response: z.looseObject({
			has_more: z.boolean().describe('是否有下一页').optional(),
			items: z.array(z.looseObject({
				content: z.looseObject({
					blocks: z.array(z.unknown()).describe('文档结构是按行排列的，每行内容是一个 Block').optional(),
				}).describe('关键结果的内容').optional(),
				create_time: z.string().describe('关键结果的创建时间，时间戳').optional(),
				deadline: z.string().describe('目标的截止时间，时间戳').optional(),
				id: z.string().describe('关键结果的 ID').optional(),
				objective_id: z.string().describe('关键结果的目标 ID').optional(),
				owner: z.looseObject({
					owner_type: z.string().describe('所有者类型').optional(),
					user_id: z.string().describe('员工 ID').optional(),
				}).describe('所有者').optional(),
				position: z.number().int().describe('关键结果的序号：从 1 开始计数').optional(),
				score: z.number().describe('关键结果的分数：[0,1]，支持一位小数').optional(),
				update_time: z.string().describe('关键结果的修改时间，时间戳').optional(),
				weight: z.number().describe('目标的权重：[0,1]，支持三位小数').optional(),
			})).describe('关键结果列表').optional(),
			page_token: z.string().describe('分页键，下一个分页需传入该键').optional(),
		}),
	},
	'okr.objectives.delete': {
		pathParams: z.strictObject({
			objective_id: z.union([z.string(), z.number().transform(String)]).describe('目标 ID'),
		}),
		response: z.looseObject({
			objective_id: z.string().describe('目标 ID').optional(),
		}),
	},
	'okr.objectives.get': {
		pathParams: z.strictObject({
			objective_id: z.union([z.string(), z.number().transform(String)]).describe('目标 ID'),
		}),
		query: z.looseObject({
			department_id_type: z.enum(['department_id', 'open_department_id']).describe('此次调用中使用的部门 ID 的类型').optional(),
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户 ID 的类型').optional(),
		}),
		response: z.looseObject({
			objective: z.looseObject({
				category_id: z.string().describe('目标的分类 ID').optional(),
				content: z.looseObject({
					blocks: z.array(z.unknown()).describe('文档结构是按行排列的，每行内容是一个 Block').optional(),
				}).describe('目标的内容').optional(),
				create_time: z.string().describe('目标的创建时间，时间戳').optional(),
				cycle_id: z.string().describe('目标的用户周期 ID').optional(),
				deadline: z.string().describe('目标的截止时间，时间戳').optional(),
				id: z.string().describe('目标的 ID').optional(),
				notes: z.looseObject({
					blocks: z.array(z.unknown()).describe('文档结构是按行排列的，每行内容是一个 Block').optional(),
				}).describe('目标的备注').optional(),
				owner: z.looseObject({
					owner_type: z.string().describe('所有者类型').optional(),
					user_id: z.string().describe('员工 ID').optional(),
				}).describe('所有者').optional(),
				position: z.number().int().describe('目标的序号：从 1 开始计数').optional(),
				score: z.number().describe('目标的分数：[0,1]，支持一位小数').optional(),
				update_time: z.string().describe('目标的更新时间，时间戳').optional(),
				weight: z.number().describe('目标的权重：[0,1]，支持三位小数').optional(),
			}).describe('目标').optional(),
		}),
	},
	'okr.objectives.key_results_position': {
		pathParams: z.strictObject({
			objective_id: z.union([z.string(), z.number().transform(String)]).describe('目标 ID'),
		}),
		query: z.looseObject({
			department_id_type: z.enum(['department_id', 'open_department_id']).describe('此次调用中使用的部门 ID 的类型').optional(),
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户 ID 的类型').optional(),
		}),
		body: z.looseObject({
			key_result_ids: z.array(z.unknown()).describe('关键结果 ID 列表，按照序号顺序'),
		}),
		response: z.looseObject({
			items: z.array(z.looseObject({
				content: z.looseObject({
					blocks: z.array(z.unknown()).describe('文档结构是按行排列的，每行内容是一个 Block').optional(),
				}).describe('关键结果的内容').optional(),
				create_time: z.string().describe('关键结果的创建时间，时间戳').optional(),
				deadline: z.string().describe('目标的截止时间，时间戳').optional(),
				id: z.string().describe('关键结果的 ID').optional(),
				objective_id: z.string().describe('关键结果的目标 ID').optional(),
				owner: z.looseObject({
					owner_type: z.string().describe('所有者类型').optional(),
					user_id: z.string().describe('员工 ID').optional(),
				}).describe('所有者').optional(),
				position: z.number().int().describe('关键结果的序号：从 1 开始计数').optional(),
				score: z.number().describe('关键结果的分数：[0,1]，支持一位小数').optional(),
				update_time: z.string().describe('关键结果的修改时间，时间戳').optional(),
				weight: z.number().describe('目标的权重：[0,1]，支持三位小数').optional(),
			})).describe('关键结果列表').optional(),
		}),
	},
	'okr.objectives.key_results_weight': {
		pathParams: z.strictObject({
			objective_id: z.union([z.string(), z.number().transform(String)]).describe('目标 ID'),
		}),
		query: z.looseObject({
			department_id_type: z.enum(['department_id', 'open_department_id']).describe('此次调用中使用的部门 ID 的类型').optional(),
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户 ID 的类型').optional(),
		}),
		body: z.looseObject({
			key_result_weights: z.array(z.looseObject({
				key_result_id: z.string().describe('关键结果 ID'),
				weight: z.number().describe('目标的权重：[0,1]，支持三位小数'),
			})).describe('关键结果权重列表'),
		}),
		response: z.looseObject({
			items: z.array(z.looseObject({
				content: z.looseObject({
					blocks: z.array(z.unknown()).describe('文档结构是按行排列的，每行内容是一个 Block').optional(),
				}).describe('关键结果的内容').optional(),
				create_time: z.string().describe('关键结果的创建时间，时间戳').optional(),
				deadline: z.string().describe('目标的截止时间，时间戳').optional(),
				id: z.string().describe('关键结果的 ID').optional(),
				objective_id: z.string().describe('关键结果的目标 ID').optional(),
				owner: z.looseObject({
					owner_type: z.string().describe('所有者类型').optional(),
					user_id: z.string().describe('员工 ID').optional(),
				}).describe('所有者').optional(),
				position: z.number().int().describe('关键结果的序号：从 1 开始计数').optional(),
				score: z.number().describe('关键结果的分数：[0,1]，支持一位小数').optional(),
				update_time: z.string().describe('关键结果的修改时间，时间戳').optional(),
				weight: z.number().describe('目标的权重：[0,1]，支持三位小数').optional(),
			})).describe('关键结果列表').optional(),
		}),
	},
	'okr.objectives.patch': {
		pathParams: z.strictObject({
			objective_id: z.union([z.string(), z.number().transform(String)]).describe('目标 ID'),
		}),
		query: z.looseObject({
			department_id_type: z.enum(['department_id', 'open_department_id']).describe('此次调用中使用的部门 ID 的类型').optional(),
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户 ID 的类型').optional(),
		}),
		body: z.looseObject({
			category_id: z.string().describe('目标的分类 ID').optional(),
			content: z.looseObject({
				blocks: z.array(z.looseObject({
					block_element_type: z.enum(['paragraph', 'gallery']).describe('文档元素类型').optional(),
					gallery: z.record(z.string(), z.unknown()).describe('图片').optional(),
					paragraph: z.record(z.string(), z.unknown()).describe('文本段落').optional(),
				})).describe('文档结构是按行排列的，每行内容是一个 Block').optional(),
			}).describe('目标的内容').optional(),
			deadline: z.string().describe('目标的截止时间，时间戳').optional(),
			notes: z.looseObject({
				blocks: z.array(z.looseObject({
					block_element_type: z.enum(['paragraph', 'gallery']).describe('文档元素类型').optional(),
					gallery: z.record(z.string(), z.unknown()).describe('图片').optional(),
					paragraph: z.record(z.string(), z.unknown()).describe('文本段落').optional(),
				})).describe('文档结构是按行排列的，每行内容是一个 Block').optional(),
			}).describe('目标的备注').optional(),
			score: z.number().describe('目标的分数：[0,1]，支持一位小数').optional(),
		}),
		response: z.looseObject({
			objective: z.looseObject({
				category_id: z.string().describe('目标的分类 ID').optional(),
				content: z.looseObject({
					blocks: z.array(z.unknown()).describe('文档结构是按行排列的，每行内容是一个 Block').optional(),
				}).describe('目标的内容').optional(),
				create_time: z.string().describe('目标的创建时间，时间戳').optional(),
				cycle_id: z.string().describe('目标的用户周期 ID').optional(),
				deadline: z.string().describe('目标的截止时间，时间戳').optional(),
				id: z.string().describe('目标的 ID').optional(),
				notes: z.looseObject({
					blocks: z.array(z.unknown()).describe('文档结构是按行排列的，每行内容是一个 Block').optional(),
				}).describe('目标的备注').optional(),
				owner: z.looseObject({
					owner_type: z.string().describe('所有者类型').optional(),
					user_id: z.string().describe('员工 ID').optional(),
				}).describe('所有者').optional(),
				position: z.number().int().describe('目标的序号：从 1 开始计数').optional(),
				score: z.number().describe('目标的分数：[0,1]，支持一位小数').optional(),
				update_time: z.string().describe('目标的更新时间，时间戳').optional(),
				weight: z.number().describe('目标的权重：[0,1]，支持三位小数').optional(),
			}).describe('目标').optional(),
		}),
	},
} satisfies Record<string, FeishuApiSchemas>;
