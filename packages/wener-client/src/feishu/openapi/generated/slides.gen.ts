// Generated from larksuite/cli internal/registry/meta_data.json @ b2b43630c560b00b5634e5614826801a94e1ae40 (MIT License, Copyright (c) 2026 Lark Technologies Pte. Ltd.). Do not edit.
// Regenerate: FEISHU_OPENAPI_META=<meta_data.json> FEISHU_OPENAPI_COMMIT=<sha> node --import tsx packages/wener-client/scripts/generate-feishu-openapi.ts
import { z } from 'zod';
import type { FeishuApiSchemas } from '../types';

export const FeishuApiSlides = {
	'slides.xml_presentation.slide.create': {
		pathParams: z.strictObject({
			xml_presentation_id: z.union([z.string(), z.number().transform(String)]).describe('演示文稿唯一标识'),
		}),
		query: z.looseObject({
			revision_id: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('演示文稿的版本号，-1 表示最新版本').optional(),
			tid: z.string().describe('锁的事务 ID，用于并发控制').optional(),
		}),
		body: z.looseObject({
			before_slide_id: z.string().describe('插入到指定页面之前，为空时插入到末尾').optional(),
			slide: z.looseObject({
				content: z.string().describe('幻灯片页面的 XML 内容').optional(),
				slide_id: z.string().describe('幻灯片页面的 short ID').optional(),
			}).describe('页面内容'),
		}),
		response: z.looseObject({
			revision_id: z.number().int().describe('演示文稿的最新版本号').optional(),
			slide_id: z.string().describe('新创建页面的唯一标识').optional(),
		}),
	},
	'slides.xml_presentation.slide.delete': {
		pathParams: z.strictObject({
			xml_presentation_id: z.union([z.string(), z.number().transform(String)]).describe('演示文稿唯一标识'),
		}),
		query: z.looseObject({
			revision_id: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('演示文稿的版本号，-1 表示最新版本').optional(),
			slide_id: z.string().describe('页面唯一标识'),
			tid: z.string().describe('锁的事务 ID，用于并发控制').optional(),
		}),
		response: z.looseObject({
			revision_id: z.number().int().describe('演示文稿的最新版本号').optional(),
		}),
	},
	'slides.xml_presentation.slide.get': {
		pathParams: z.strictObject({
			xml_presentation_id: z.union([z.string(), z.number().transform(String)]).describe('演示文稿唯一标识'),
		}),
		query: z.looseObject({
			revision_id: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('演示文稿的版本号，-1 表示最新版本').optional(),
			slide_id: z.string().describe('页面唯一标识'),
		}),
		response: z.looseObject({
			revision_id: z.number().int().describe('演示文稿的版本号').optional(),
			slide: z.looseObject({
				content: z.string().describe('幻灯片页面的 XML 内容').optional(),
				slide_id: z.string().describe('幻灯片页面的 short ID').optional(),
			}).describe('页面内容').optional(),
		}),
	},
	'slides.xml_presentation.slide.replace': {
		pathParams: z.strictObject({
			xml_presentation_id: z.union([z.string(), z.number().transform(String)]).describe('演示文稿唯一标识'),
		}),
		query: z.looseObject({
			revision_id: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('演示文稿的版本号，-1 表示最新版本').optional(),
			slide_id: z.string().describe('页面唯一标识'),
			tid: z.string().describe('锁的事务 ID，用于并发控制').optional(),
		}),
		body: z.looseObject({
			comment: z.string().describe('操作备注').optional(),
			parts: z.array(z.looseObject({
				action: z.string().describe('操作类型：str_replace（字符串替换）、block_replace（块替换）、block_insert（块插入）'),
				block_id: z.string().describe('目标块的唯一标识，block_replace 时使用，格式为 3 位 short element ID').optional(),
				insert_before_block_id: z.string().describe('在指定块之前插入，为空时追加到末尾，block_insert 时使用，格式为 3 位 short element ID').optional(),
				insertion: z.string().describe('要插入的 XML 元素片段，block_insert 时使用').optional(),
				is_multiple: z.boolean().describe('是否替换所有匹配项，默认只替换第一个，str_replace 时使用').optional(),
				pattern: z.string().describe('查找的字符串模式，str_replace 时使用').optional(),
				replacement: z.string().describe('替换内容，str_replace 和 block_replace 时使用').optional(),
			})).describe('替换操作列表，每项包含一个元素级别的编辑操作，最少1条，最多200条'),
		}),
		response: z.looseObject({
			failed_part_index: z.number().int().describe('失败的操作在 parts 数组中的索引，整个请求失败时返回').optional(),
			failed_reason: z.string().describe('失败原因描述').optional(),
			revision_id: z.number().int().describe('演示文稿的最新版本号').optional(),
		}),
	},
	'slides.xml_presentations.get': {
		pathParams: z.strictObject({
			xml_presentation_id: z.union([z.string(), z.number().transform(String)]).describe('演示文稿唯一标识'),
		}),
		query: z.looseObject({
			revision_id: z.preprocess((value) => (typeof value === 'string' && !value.trim() ? undefined : value), z.coerce.number().int()).describe('演示文稿的版本号，-1 表示最新版本').optional(),
		}),
		response: z.looseObject({
			xml_presentation: z.looseObject({
				content: z.string().describe('演示文稿的 XML 内容').optional(),
				presentation_id: z.string().describe('演示文稿的ID').optional(),
				revision_id: z.number().int().describe('演示文稿的版本号').optional(),
			}).describe('演示文稿内容').optional(),
		}),
	},
} satisfies Record<string, FeishuApiSchemas>;
