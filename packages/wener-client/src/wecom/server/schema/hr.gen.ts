// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

export const GetEmployeeFieldConfigResponseSchema = z.object({
  /** 字段组的配置信息 */
  group_list: z.array(z.object({ group_id: z.number(), group_name: z.string(), field_list: z.array(z.object({ field_id: z.number(), field_name: z.string(), field_type: z.number(), value_type: z.number(), is_must: z.boolean(), option_list: z.array(z.object({ id: z.number(), value: z.string() })) })) })).optional(),
});
export type GetEmployeeFieldConfigResponse = z.infer<typeof GetEmployeeFieldConfigResponseSchema>;

/**
 * 获取员工花名册信息
 * @see https://developer.work.weixin.qq.com/document/path/99132
 */
export const GetStaffInfoRequestSchema = z.object({
  /** 需要获取花名册信息的员工的userid，该员工需要在调用应用的可见范围内 */
  userid: z.string().min(1).max(64),
  /** 是否获取全部字段信息，不填时默认为否 (true-获取全部, false-不获取全部) */
  get_all: z.boolean().optional(),
  /** 需要获取的字段信息。参数get_all为否或不填时，此字段不能为空 */
  fieldids: z.array(z.object({ fieldid: z.number().min(0), sub_idx: z.number().min(0).default(0) })).optional(),
});
export type GetStaffInfoRequest = z.infer<typeof GetStaffInfoRequestSchema>;
export const GetStaffInfoResponseSchema = z.object({
  /** 获取到的字段信息 */
  field_info: z.array(z.object({ fieldid: z.number(), sub_idx: z.number(), result: z.number(), value_type: z.number(), value_string: z.string(), value_uint64: z.number(), value_uint32: z.number(), value_int64: z.number(), value_mobile: z.object({ value_country_code: z.string(), value_mobile: z.string() }), value_file: z.object({ media_id: z.array(z.string()) }) })).optional(),
});
export type GetStaffInfoResponse = z.infer<typeof GetStaffInfoResponseSchema>;

/**
 * 更新员工花名册信息
 * @see https://developer.work.weixin.qq.com/document/path/99133
 */
export const UpdateStaffInfoRequestSchema = z.object({
  /** 需要更新花名册信息的员工的userid */
  userid: z.string().min(1).max(64),
  /** 需要更新、增加或清空单个字段的内容 */
  update_items: z.array(z.object({ fieldid: z.number().min(10000).max(99999), sub_idx: z.number().min(0).default(0), value_string: z.string().min(0).max(256), value_uint32: z.number().min(0).max(4294967295), value_uint64: z.number().min(0), value_int64: z.number(), value_mobile: z.object({ value_country_code: z.string().min(1).max(5), value_mobile: z.string().min(0).max(20) }) })).optional(),
  /** 需要整组字段进行删除的字段组 */
  remove_items: z.array(z.object({ group_type: z.number(), sub_idx: z.number().min(0) })).optional(),
  /** 需要增加一组字段的字段组 */
  insert_items: z.array(z.object({ group_type: z.number(), item: z.array(z.object({ fieldid: z.number().min(10000).max(99999), sub_idx: z.number().min(0).default(0), value_string: z.string().min(0).max(256), value_uint32: z.number().min(0).max(4294967295), value_mobile: z.object({ value_country_code: z.string().min(1).max(5), value_mobile: z.string().min(0).max(20) }) })) })).optional(),
});
export type UpdateStaffInfoRequest = z.infer<typeof UpdateStaffInfoRequestSchema>;
export const UpdateStaffInfoResponseSchema = z.object({
  /** 更新字段的结果 */
  update_results: z.array(z.object({ fieldid: z.number(), sub_idx: z.number(), result: z.number() })).optional(),
  /** 删除字段组的结果 */
  remove_results: z.array(z.object({ group_type: z.number(), sub_idx: z.number(), result: z.number() })).optional(),
  /** 增加字段组的结果 */
  insert_result: z.array(z.object({ group_type: z.number(), idx: z.number(), result: z.number() })).optional(),
});
export type UpdateStaffInfoResponse = z.infer<typeof UpdateStaffInfoResponseSchema>;

