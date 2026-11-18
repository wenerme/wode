// Generated from larksuite/cli internal/registry/meta_data.json @ b2b43630c560b00b5634e5614826801a94e1ae40 (MIT License, Copyright (c) 2026 Lark Technologies Pte. Ltd.). Do not edit.
// Regenerate: FEISHU_OPENAPI_META=<meta_data.json> FEISHU_OPENAPI_COMMIT=<sha> node --import tsx packages/wener-client/scripts/generate-feishu-openapi.ts
import { z } from 'zod';
import type { FeishuApiSchemas } from '../types';

export const FeishuApiSheets = {
	'sheets.spreadsheet.sheet.filters.create': {
		pathParams: z.strictObject({
			sheet_id: z.union([z.string(), z.number().transform(String)]).describe('工作表 ID，通过[获取工作表](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/sheets-v3/spreadsheet-sheet/query) 获取'),
			spreadsheet_token: z.union([z.string(), z.number().transform(String)]).describe('电子表格的 token'),
		}),
		body: z.looseObject({
			col: z.string().describe('设置应用筛选条件的列'),
			condition: z.looseObject({
				compare_type: z.string().describe('比较类型').optional(),
				expected: z.array(z.unknown()).describe('筛选参数'),
				filter_type: z.string().describe('筛选类型，枚举值如下所示'),
			}).describe('设置筛选条件'),
			range: z.string().describe('设置筛选的应用范围'),
		}),
	},
	'sheets.spreadsheet.sheet.filters.delete': {
		pathParams: z.strictObject({
			sheet_id: z.union([z.string(), z.number().transform(String)]).describe('工作表 ID，通过[获取工作表](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/sheets-v3/spreadsheet-sheet/query) 获取'),
			spreadsheet_token: z.union([z.string(), z.number().transform(String)]).describe('电子表格的 token'),
		}),
	},
	'sheets.spreadsheet.sheet.filters.get': {
		pathParams: z.strictObject({
			sheet_id: z.union([z.string(), z.number().transform(String)]).describe('工作表 ID，通过[获取工作表](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/sheets-v3/spreadsheet-sheet/query) 获取'),
			spreadsheet_token: z.union([z.string(), z.number().transform(String)]).describe('电子表格的 token'),
		}),
		response: z.looseObject({
			sheet_filter_info: z.looseObject({
				filter_infos: z.array(z.looseObject({
					col: z.string().describe('设置了筛选条件的列').optional(),
					conditions: z.array(z.unknown()).describe('筛选条件').optional(),
				})).describe('工作表的筛选条件').optional(),
				filtered_out_rows: z.array(z.unknown()).describe('被筛选条件过滤掉的行').optional(),
				range: z.string().describe('筛选的应用范围').optional(),
			}).describe('筛选信息').optional(),
		}),
	},
	'sheets.spreadsheet.sheet.filters.update': {
		pathParams: z.strictObject({
			sheet_id: z.union([z.string(), z.number().transform(String)]).describe('工作表 ID，通过[获取工作表](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/sheets-v3/spreadsheet-sheet/query) 获取'),
			spreadsheet_token: z.union([z.string(), z.number().transform(String)]).describe('电子表格的 token'),
		}),
		body: z.looseObject({
			col: z.string().describe('指定要更新筛选条件的列'),
			condition: z.looseObject({
				compare_type: z.string().describe('比较类型').optional(),
				expected: z.array(z.unknown()).describe('筛选参数'),
				filter_type: z.string().describe('筛选类型，枚举值如下所示'),
			}).describe('设置筛选条件'),
		}),
	},
	'sheets.spreadsheet.sheets.find': {
		pathParams: z.strictObject({
			sheet_id: z.union([z.string(), z.number().transform(String)]).describe('工作表的 ID，获取方式见[获取工作表](https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/sheets-v3/spreadsheet-sheet/query)'),
			spreadsheet_token: z.union([z.string(), z.number().transform(String)]).describe('电子表格的 token'),
		}),
		body: z.looseObject({
			find: z.string().describe('查找的字符串'),
			find_condition: z.looseObject({
				include_formulas: z.boolean().describe('是否仅搜索单元格公式，默认值为 false').optional(),
				match_case: z.boolean().describe('是否忽略查找字符串的大小写，默认为 false').optional(),
				match_entire_cell: z.boolean().describe('字符串是否需要完全匹配整个单元格，默认值为 false').optional(),
				range: z.string().describe('查找范围'),
				search_by_regex: z.boolean().describe('是否使用正则表达式查找，默认值为 false').optional(),
			}).describe('指定查找单元格的条件'),
		}),
		response: z.looseObject({
			find_result: z.looseObject({
				matched_cells: z.array(z.unknown()).describe('符合查找条件的单元格数组，不包含公式').optional(),
				matched_formula_cells: z.array(z.unknown()).describe('符合查找条件的含有公式的单元格数组').optional(),
				rows_count: z.number().int().describe('符合查找条件的总行数').optional(),
			}).describe('符合条件的信息').optional(),
		}),
	},
	'sheets.spreadsheets.create': {
		body: z.looseObject({
			folder_token: z.string().describe('文件夹 token').optional(),
			title: z.string().describe('表格标题').optional(),
			without_mount: z.boolean().describe('是否挂载到云空间').optional(),
		}),
		response: z.looseObject({
			spreadsheet: z.looseObject({
				folder_token: z.string().describe('文件夹 token').optional(),
				spreadsheet_token: z.string().describe('电子表格 token').optional(),
				title: z.string().describe('电子表格标题').optional(),
				url: z.string().describe('电子表格的 URL 链接').optional(),
				without_mount: z.boolean().describe('是否挂载到云空间').optional(),
			}).describe('电子表格的基础信息').optional(),
		}),
	},
	'sheets.spreadsheets.get': {
		pathParams: z.strictObject({
			spreadsheet_token: z.union([z.string(), z.number().transform(String)]).describe('电子表格的 token'),
		}),
		query: z.looseObject({
			user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('此次调用中使用的用户ID的类型').optional(),
		}),
		response: z.looseObject({
			spreadsheet: z.looseObject({
				owner_id: z.string().describe('电子表格的所有者 ID').optional(),
				title: z.string().describe('电子表格标题').optional(),
				token: z.string().describe('电子表格 token').optional(),
				url: z.string().describe('电子表格的 URL 链接').optional(),
			}).describe('电子表格的基础信息').optional(),
		}),
	},
	'sheets.spreadsheets.patch': {
		pathParams: z.strictObject({
			spreadsheet_token: z.union([z.string(), z.number().transform(String)]).describe('电子表格的 token'),
		}),
		body: z.looseObject({
			title: z.string().describe('新的电子表格标题').optional(),
		}),
	},
} satisfies Record<string, FeishuApiSchemas>;
