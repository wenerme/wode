// Generated from larksuite/cli internal/registry/meta_data.json @ b2b43630c560b00b5634e5614826801a94e1ae40 (MIT License, Copyright (c) 2026 Lark Technologies Pte. Ltd.). Do not edit.
// Regenerate: FEISHU_OPENAPI_META=<meta_data.json> FEISHU_OPENAPI_COMMIT=<sha> node --import tsx packages/wener-client/scripts/generate-feishu-openapi.ts
import { z } from 'zod';
import type { FeishuApiSchemas } from '../types';

export const FeishuApiAttendance = {
	'attendance.user_tasks.query': {
		query: z.looseObject({
			employee_type: z.enum(['employee_id', 'employee_no']).describe('员工ID类型'),
			ignore_invalid_users: z.union([z.boolean(), z.stringbool()]).describe('是否忽略无效和没有权限的用户，对应employee_type').optional(),
			include_terminated_user: z.union([z.boolean(), z.stringbool()]).describe('由于新入职员工可以复用已离职员工的 employee_no/employee_id，对应employee_type').optional(),
		}),
		body: z.looseObject({
			check_date_from: z.number().int().describe('查询的起始工作日，格式为yyyyMMdd'),
			check_date_to: z.number().int().describe('查询的结束工作日，格式为yyyyMMdd'),
			need_overtime_result: z.boolean().describe('是否需要加班班段打卡结果').optional(),
			user_ids: z.array(z.unknown()).describe('employee_no 或 employee_id 列表，对应employee_type，长度不超过 50'),
		}),
		response: z.looseObject({
			invalid_user_ids: z.array(z.unknown()).describe('无效用户 ID 列表，对应employee_type').optional(),
			unauthorized_user_ids: z.array(z.unknown()).describe('没有权限用户 ID 列表，对应employee_type').optional(),
			user_task_results: z.array(z.looseObject({
				day: z.number().int().describe('日期，格式为yyyyMMdd').optional(),
				employee_name: z.string().describe('用户姓名').optional(),
				group_id: z.string().describe('考勤组 ID（特别说明：1代表未加入考勤组），可用于[按 ID 查询考勤组](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/attendance-v1/gr…').optional(),
				records: z.array(z.looseObject({
					check_in_record: z.record(z.string(), z.unknown()).describe('上班打卡记录').optional(),
					check_in_record_id: z.string().describe('上班打卡记录ID').optional(),
					check_in_result: z.string().describe('上班打卡结果').optional(),
					check_in_result_supplement: z.string().describe('上班打卡结果补充').optional(),
					check_in_shift_time: z.string().describe('上班打卡时间').optional(),
					check_out_record: z.record(z.string(), z.unknown()).describe('下班打卡记录').optional(),
					check_out_record_id: z.string().describe('下班打卡记录ID').optional(),
					check_out_result: z.string().describe('下班打卡结果').optional(),
					check_out_result_supplement: z.string().describe('下班打卡结果补充').optional(),
					check_out_shift_time: z.string().describe('下班打卡时间').optional(),
					task_shift_type: z.number().int().describe('班次类型，0正常，1加班班次').optional(),
				})).describe('用户考勤记录').optional(),
				result_id: z.string().describe('打卡记录 ID').optional(),
				shift_id: z.string().describe('班次 ID（特别说明：9代表默认班次），可用于[按 ID 查询班次](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/attendance-v1/shift/…').optional(),
				user_id: z.string().describe('用户 ID，对应employee_type').optional(),
			})).describe('打卡任务列表').optional(),
		}),
	},
} satisfies Record<string, FeishuApiSchemas>;
