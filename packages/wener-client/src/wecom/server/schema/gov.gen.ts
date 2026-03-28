// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 添加网格
 * @see https://developer.work.weixin.qq.com/document/path/94556
 */
export const AddGridRequestSchema = z.object({
  /** 网格名称，不能超过30个字，同一个目标网格下不能存在同名的同级子网格 */
  grid_name: z.string().max(30),
  /** 父节点的id，网格结构层级最多支持10层 */
  grid_parent_id: z.string().min(1),
  /** 网格「负责人」userid列表，每个网格至少1个，最多20个负责人 */
  grid_admin: z.array(z.string()),
  /** 该节点的成员userid列表，不能超过100个，同一个成员最多能成功10个网格的管理员 */
  grid_member: z.array(z.string()).optional(),
});
export type AddGridRequest = z.infer<typeof AddGridRequestSchema>;
export const AddGridResponseSchema = z.object({
  /** 网格id */
  grid_id: z.string().optional(),
  /** 不合法的userid列表 */
  invalid_userids: z.array(z.string()).optional(),
});
export type AddGridResponse = z.infer<typeof AddGridResponseSchema>;

/**
 * 添加事件类别
 * @see https://developer.work.weixin.qq.com/document/path/94563
 */
export const AddEventCategoryRequestSchema = z.object({
  /** 分类名称，不能超过30个字，同一一级分类下的二级分类名字不能一样 */
  category_name: z.string().max(30),
  /** 分类层级，这里只能传1或者2 (1-一级分类, 2-二级分类) */
  level: z.number(),
  /** 所属的一级分类的id，level为2的话必传 */
  parent_category_id: z.string().optional(),
});
export type AddEventCategoryRequest = z.infer<typeof AddEventCategoryRequestSchema>;
export const AddEventCategoryResponseSchema = z.object({
  /** 分类id */
  category_id: z.string().optional(),
});
export type AddEventCategoryResponse = z.infer<typeof AddEventCategoryResponseSchema>;

/**
 * 删除网格
 * @see https://developer.work.weixin.qq.com/document/path/94559
 */
export const DeleteGridRequestSchema = z.object({
  /** 网格id，根节点可以填空 */
  grid_id: z.string(),
});
export type DeleteGridRequest = z.infer<typeof DeleteGridRequestSchema>;

/**
 * 删除事件类别
 * @see https://developer.work.weixin.qq.com/document/path/94565
 */
export const DeleteReportCategoryRequestSchema = z.object({
  /** 分类id */
  category_id: z.string().min(1),
});
export type DeleteReportCategoryRequest = z.infer<typeof DeleteReportCategoryRequestSchema>;

/**
 * 获取用户负责及参与的网格列表
 * @see https://developer.work.weixin.qq.com/document/path/94567
 */
export const GetUserGridInfoRequestSchema = z.object({
  /** 需要查询的成员userid */
  userid: z.string().min(1).max(64),
});
export type GetUserGridInfoRequest = z.infer<typeof GetUserGridInfoRequestSchema>;
export const GetUserGridInfoResponseSchema = z.object({
  /** 作为管理员管理的网格信息 */
  manage_grids: z.array(z.object({ grid_id: z.string(), grid_name: z.string() })).optional(),
  /** 作为成员参与的grid信息 */
  joined_grids: z.array(z.object({ grid_id: z.string(), grid_name: z.string() })).optional(),
});
export type GetUserGridInfoResponse = z.infer<typeof GetUserGridInfoResponseSchema>;

/**
 * 获取网格列表
 * @see https://developer.work.weixin.qq.com/document/path/94560
 */
export const ListGridRequestSchema = z.object({
  /** 网格id，不填则表示拉取根节点及其儿子节点 */
  grid_id: z.string().optional(),
});
export type ListGridRequest = z.infer<typeof ListGridRequestSchema>;
export const ListGridResponseSchema = z.object({
  /** 网格列表 */
  grid_list: z.array(z.object({ grid_id: z.string(), grid_name: z.string(), grid_parent_id: z.string(), grid_admin: z.array(z.string()), grid_member: z.array(z.string()) })).optional(),
});
export type ListGridResponse = z.infer<typeof ListGridResponseSchema>;

export const ListEventCategoryResponseSchema = z.object({
  /** 分类列表 */
  category_list: z.array(z.record(z.string(), z.any())).optional(),
  /** 分类id */
  category_id: z.string().optional(),
  /** 分类名称 */
  category_name: z.string().optional(),
  /** 分类层级 */
  level: z.number().optional(),
  /** 分类层级为1时，该字段为空 */
  parent_category_id: z.string().optional(),
});
export type ListEventCategoryResponse = z.infer<typeof ListEventCategoryResponseSchema>;

/**
 * 编辑网格
 * @see https://developer.work.weixin.qq.com/document/path/94558
 */
export const UpdateGridRequestSchema = z.object({
  /** 网格id */
  grid_id: z.string(),
  /** 网格名称，不能超过30个字，同一个目标网格下，不能存在同名的同级子网格 */
  grid_name: z.string().min(1).max(30),
  /** 父节点的id，网格结构层级最多支持10层 */
  grid_parent_id: z.string(),
  /** 网格「负责人」userid列表，每个网格至少1个，最多20个负责人 */
  grid_admin: z.array(z.string()),
  /** 该节点的成员userid列表，不能超过100个，同一个成员最多能成功10个网格的管理员，为空则表示清空所有的成员 */
  grid_member: z.array(z.string()).optional(),
});
export type UpdateGridRequest = z.infer<typeof UpdateGridRequestSchema>;
export const UpdateGridResponseSchema = z.object({
  /** 不合法的userid列表 */
  invalid_userids: z.array(z.string()).optional(),
});
export type UpdateGridResponse = z.infer<typeof UpdateGridResponseSchema>;

/**
 * 修改事件类别
 * @see https://developer.work.weixin.qq.com/document/path/94564
 */
export const UpdateCategoryRequestSchema = z.object({
  /** 分类id */
  category_id: z.string(),
  /** 分类名称，同一一级分类下的二级分类名字不能一样 */
  category_name: z.string().min(1).max(30),
  /** 分类层级 (1-一级, 2-二级) */
  level: z.number(),
  /** 所属的一级分类的id，level为2的话必传 */
  parent_category_id: z.string().optional(),
});
export type UpdateCategoryRequest = z.infer<typeof UpdateCategoryRequestSchema>;

/**
 * 获取上报事件分类统计
 * @see https://developer.work.weixin.qq.com/document/path/93606
 */
export const GetPatrolCategoryStatisticRequestSchema = z.object({
  /** 分类ID，不传此字段拉取所有一级分类数据，传一级分类ID拉取其下所有二级分类数据 */
  category_id: z.string().optional(),
});
export type GetPatrolCategoryStatisticRequest = z.infer<typeof GetPatrolCategoryStatisticRequestSchema>;
export const GetPatrolCategoryStatisticResponseSchema = z.object({
  /** 分类统计列表 */
  dashboard_list: z.array(z.object({ category_id: z.string(), category_name: z.string(), category_level: z.number(), total_case: z.number().min(0), total_solved: z.number().min(0), category_type: z.number() })).optional(),
});
export type GetPatrolCategoryStatisticResponse = z.infer<typeof GetPatrolCategoryStatisticResponseSchema>;

/**
 * 获取单位巡查上报数据统计
 * @see https://developer.work.weixin.qq.com/document/path/93604
 */
export const GetPatrolCorpStatusRequestSchema = z.object({
  /** 网格id，不传的话获取整个企业的概况 */
  grid_id: z.string().optional(),
});
export type GetPatrolCorpStatusRequest = z.infer<typeof GetPatrolCorpStatusRequestSchema>;
export const GetPatrolCorpStatusResponseSchema = z.object({
  /** 办理中 */
  processing: z.number().optional(),
  /** 今日上报 */
  added_today: z.number().optional(),
  /** 今日办结 */
  solved_today: z.number().optional(),
  /** 累计上报 */
  total_case: z.number().optional(),
  /** 待分配 */
  to_be_assigned: z.number().optional(),
  /** 累计办结 */
  total_solved: z.number().optional(),
});
export type GetPatrolCorpStatusResponse = z.infer<typeof GetPatrolCorpStatusResponseSchema>;

export const GetGridInfoResponseSchema = z.object({
  /** 网格列表 */
  grid_list: z.array(z.record(z.string(), z.any())).optional(),
  /** 网格 ID */
  grid_id: z.string().optional(),
  /** 网格名称 */
  grid_name: z.number().optional(),
  /** 网格管理员 userId 列表 */
  grid_admin: z.array(z.any()).optional(),
});
export type GetGridInfoResponse = z.infer<typeof GetGridInfoResponseSchema>;

/**
 * 获取巡查上报的事件详情信息
 * @see https://developer.work.weixin.qq.com/document/path/93608
 */
export const GetPatrolOrderInfoRequestSchema = z.object({
  /** 工单id，支持通过工单id直接查询某工单 */
  order_id: z.string().min(1),
});
export type GetPatrolOrderInfoRequest = z.infer<typeof GetPatrolOrderInfoRequestSchema>;
export const GetPatrolOrderInfoResponseSchema = z.object({
  /** 工单详情对象 */
  order_info: z.object({ order_id: z.string(), desc: z.string(), urge_type: z.number(), case_name: z.string(), grid_name: z.string(), grid_id: z.string(), create_time: z.number(), image_urls: z.array(z.string()), video_media_ids: z.array(z.string()), location: z.object({ name: z.string(), address: z.string(), latitude: z.string(), longitude: z.string() }), processor_userids: z.array(z.string()), process_list: z.array(z.object({ process_type: z.number(), solve_userid: z.string(), process_desc: z.string(), status: z.number(), solved_time: z.number(), image_urls: z.array(z.string()), video_media_ids: z.array(z.string()) })) }).optional(),
});
export type GetPatrolOrderInfoResponse = z.infer<typeof GetPatrolOrderInfoResponseSchema>;

/**
 * 获取巡查上报事件列表
 * @see https://developer.work.weixin.qq.com/document/path/93607
 */
export const ListPatrolOrderRequestSchema = z.object({
  /** 时间戳，筛选返回begin_create_time之后新创建的上报 [timestamp] */
  begin_create_time: z.number().optional(),
  /** 时间戳，筛选返回begin_modify_time之后新修改的上报 [timestamp] */
  begin_modify_time: z.number().optional(),
  /** 翻页参数，首次查询为空，如果查询条件有变更，需要将这个字段置空 */
  cursor: z.string().optional(),
  /** 单页条数，如果不填，默认20条，最大50 */
  limit: z.number().max(50).default(20).optional(),
});
export type ListPatrolOrderRequest = z.infer<typeof ListPatrolOrderRequestSchema>;
export const ListPatrolOrderResponseSchema = z.object({
  /** 获取下一页数据的凭据，为空字符串代表是最后一页 */
  next_cursor: z.string().optional(),
  /** 事件列表 */
  order_list: z.array(z.object({ order_id: z.string(), desc: z.string(), urge_type: z.number(), case_name: z.string(), grid_name: z.string(), grid_id: z.string(), create_time: z.number(), image_urls: z.array(z.string()), video_media_ids: z.array(z.string()), location: z.object({ name: z.string(), address: z.string(), latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) }), processor_userids: z.array(z.string()), process_list: z.array(z.object({ process_type: z.number(), solve_userid: z.string(), process_desc: z.string(), status: z.number(), solved_time: z.number(), image_urls: z.array(z.string()), video_media_ids: z.array(z.string()) })) })).optional(),
});
export type ListPatrolOrderResponse = z.infer<typeof ListPatrolOrderResponseSchema>;

/**
 * 获取个人巡查上报数据统计
 * @see https://developer.work.weixin.qq.com/document/path/93605
 */
export const GetPatrolUserStatusRequestSchema = z.object({
  /** 成员的userId */
  userid: z.string().min(1),
});
export type GetPatrolUserStatusRequest = z.infer<typeof GetPatrolUserStatusRequestSchema>;
export const GetPatrolUserStatusResponseSchema = z.object({
  /** 办理中数量 */
  processing: z.number().optional(),
  /** 今日上报数量 */
  added_today: z.number().optional(),
  /** 今日办结数量 */
  solved_today: z.number().optional(),
});
export type GetPatrolUserStatusResponse = z.infer<typeof GetPatrolUserStatusResponseSchema>;

/**
 * 获取上报事件分类统计
 * @see https://developer.work.weixin.qq.com/document/path/93612
 */
export const GetReportCategoryStatisticRequestSchema = z.object({
  /** 分类ID。不传此字段，拉取所有一级分类数据；传一级分类ID，拉取该一级下的所有二级分类数据 */
  category_id: z.string().optional(),
});
export type GetReportCategoryStatisticRequest = z.infer<typeof GetReportCategoryStatisticRequestSchema>;
export const GetReportCategoryStatisticResponseSchema = z.object({
  /** 分类统计列表 */
  dashboard_list: z.array(z.object({ category_id: z.string(), category_name: z.string(), category_level: z.number(), total_case: z.number().min(0), total_solved: z.number().min(0), category_type: z.number() })).optional(),
});
export type GetReportCategoryStatisticResponse = z.infer<typeof GetReportCategoryStatisticResponseSchema>;

/**
 * 获取单位居民上报数据统计
 * @see https://developer.work.weixin.qq.com/document/path/93610
 */
export const GetCorpResidentStatusRequestSchema = z.object({
  /** 网格id，不传的话获取整个企业的概况 */
  grid_id: z.string().optional(),
});
export type GetCorpResidentStatusRequest = z.infer<typeof GetCorpResidentStatusRequestSchema>;
export const GetCorpResidentStatusResponseSchema = z.object({
  /** 办理中数量 */
  processing: z.number().optional(),
  /** 今日上报数量 */
  added_today: z.number().optional(),
  /** 今日办结数量 */
  solved_today: z.number().optional(),
  /** 待受理数量 */
  pending: z.number().optional(),
  /** 累计上报数量 */
  total_case: z.number().optional(),
  /** 累计受理数量 */
  total_accepted: z.number().optional(),
  /** 累计办结数量 */
  total_solved: z.number().optional(),
});
export type GetCorpResidentStatusResponse = z.infer<typeof GetCorpResidentStatusResponseSchema>;

/**
 * 获取居民上报的事件详情信息
 * @see https://developer.work.weixin.qq.com/document/path/93614
 */
export const GetResidentOrderInfoRequestSchema = z.object({
  /** 工单id，支持通过工单id直接查询某工单，此参数不为空的话，其他参数无效 */
  order_id: z.string().min(1),
});
export type GetResidentOrderInfoRequest = z.infer<typeof GetResidentOrderInfoRequestSchema>;
export const GetResidentOrderInfoResponseSchema = z.object({
  /** 工单详细信息 */
  order_info: z.object({ order_id: z.string(), desc: z.string(), urge_type: z.number(), case_name: z.string(), grid_name: z.string(), grid_id: z.string(), reporter_name: z.string(), reporter_mobile: z.string(), unionid: z.string(), image_urls: z.array(z.string()), video_media_ids: z.array(z.string()), create_time: z.number(), location: z.object({ name: z.string(), address: z.string(), latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) }), processor_userids: z.array(z.string()), process_list: z.array(z.object({ process_type: z.number(), solve_userid: z.string(), process_desc: z.string(), status: z.number(), solved_time: z.number(), image_urls: z.array(z.string()), video_media_ids: z.array(z.string()) })) }).optional(),
});
export type GetResidentOrderInfoResponse = z.infer<typeof GetResidentOrderInfoResponseSchema>;

/**
 * 获取居民上报事件列表
 * @see https://developer.work.weixin.qq.com/document/path/93613
 */
export const ListResidentOrderRequestSchema = z.object({
  /** 时间戳，筛选返回begin_create_time之后新创建的上报 [timestamp] */
  begin_create_time: z.number().optional(),
  /** 时间戳，筛选返回begin_modify_time之后新修改的上报 [timestamp] */
  begin_modify_time: z.number().optional(),
  /** 翻页参数，首次查询为空，如果查询条件有变更，需要将这个字段置空 */
  cursor: z.string().min(0).default('').optional(),
  /** 单页条数，如果不填，默认20条，最大50 */
  limit: z.number().min(1).max(50).default(20).optional(),
});
export type ListResidentOrderRequest = z.infer<typeof ListResidentOrderRequestSchema>;
export const ListResidentOrderResponseSchema = z.object({
  /** 获取下一页数据的凭据，为空字符串代表是最后一页 */
  next_cursor: z.string().optional(),
  /** 工单列表 */
  order_list: z.array(z.object({ order_id: z.string(), desc: z.string(), urge_type: z.number(), case_name: z.string(), grid_name: z.string(), grid_id: z.string(), create_time: z.number(), reporter_name: z.string(), reporter_mobile: z.string(), unionid: z.string(), image_urls: z.array(z.string()), video_media_ids: z.array(z.string()), location: z.object({ name: z.string(), address: z.string(), latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) }), processor_userids: z.array(z.string()), process_list: z.array(z.object({ process_type: z.number(), solve_userid: z.string(), process_desc: z.string(), status: z.number(), solved_time: z.number(), image_urls: z.array(z.string()), video_media_ids: z.array(z.string()) })) })).optional(),
});
export type ListResidentOrderResponse = z.infer<typeof ListResidentOrderResponseSchema>;

/**
 * 获取个人居民上报数据统计
 * @see https://developer.work.weixin.qq.com/document/path/93611
 */
export const GetResidentUserStatusRequestSchema = z.object({
  /** 成员的userId */
  userid: z.string(),
});
export type GetResidentUserStatusRequest = z.infer<typeof GetResidentUserStatusRequestSchema>;
export const GetResidentUserStatusResponseSchema = z.object({
  /** 办理中数量 */
  processing: z.number().optional(),
  /** 今日上报数量 */
  added_today: z.number().optional(),
  /** 今日办结数量 */
  solved_today: z.number().optional(),
  /** 待受理数量 */
  pending: z.number().optional(),
});
export type GetResidentUserStatusResponse = z.infer<typeof GetResidentUserStatusResponseSchema>;

