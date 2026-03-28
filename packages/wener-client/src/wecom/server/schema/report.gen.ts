// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 下载微盘文件
 * @see https://developer.work.weixin.qq.com/document/path/98021
 */
export const DownloadWeDriveFileRequestSchema = z.object({
  /** 汇报记录id */
  journaluuid: z.string(),
  /** 微盘fileid。必须是journaluuid对应的汇报关联的wedrive_files */
  fileid: z.string(),
});
export type DownloadWeDriveFileRequest = z.infer<typeof DownloadWeDriveFileRequestSchema>;
export const DownloadWeDriveFileResponseSchema = z.object({
  /** 下载请求url (有效期2个小时) */
  download_url: z.string().optional(),
  /** 下载请求带cookie的key */
  cookie_name: z.string().optional(),
  /** 下载请求带cookie的value */
  cookie_value: z.string().optional(),
});
export type DownloadWeDriveFileResponse = z.infer<typeof DownloadWeDriveFileResponseSchema>;

/**
 * 获取汇报记录详情
 * @see https://developer.work.weixin.qq.com/document/path/93394
 */
export const GetJournalDetailRequestSchema = z.object({
  /** 汇报记录单号 */
  journaluuid: z.string().max(256),
});
export type GetJournalDetailRequest = z.infer<typeof GetJournalDetailRequestSchema>;
export const GetJournalDetailResponseSchema = z.object({
  /** 汇报详情 */
  info: z.object({ journal_uuid: z.string(), template_name: z.string(), template_id: z.string(), report_time: z.number(), submitter: z.object({ userid: z.string() }), receivers: z.array(z.object({ userid: z.string() })), readed_receivers: z.array(z.object({ userid: z.string() })), apply_data: z.object({ contents: z.array(z.object({ control: z.string(), id: z.string(), title: z.object({ text: z.string() }), value: z.object({ text: z.string(), new_number: z.string(), new_money: z.string(), date: z.object({ type: z.string(), s_timestamp: z.string() }), selector: z.object({ type: z.string(), options: z.array(z.object({ key: z.string(), value: z.array(z.object({ text: z.string() })) })) }), members: z.array(z.object({ userid: z.string() })), departments: z.array(z.object({ openapi_id: z.string() })), files: z.array(z.object({ file_id: z.string() })), children: z.array(z.object({ list: z.array(z.object({ control: z.string(), id: z.string(), title: z.object({ text: z.string() }), value: z.object({ text: z.string() }) })) })), date_range: z.object({ type: z.string(), new_begin: z.number(), new_end: z.number(), new_duration: z.number() }), location: z.object({ latitude: z.string(), longitude: z.string(), title: z.string(), address: z.string(), time: z.number() }), formula: z.object({ value: z.string() }), students: z.array(z.object({ name: z.string() })), classes: z.array(z.object({ name: z.string() })), docs: z.array(z.object({ docid: z.string(), doc_url: z.string() })), wedrive_files: z.array(z.object({ fileid: z.string() })) }) })) }), sys_journal_data: z.string(), comments: z.array(z.object({ commentid: z.number(), tocommentid: z.number(), comment_userinfo: z.object({ userid: z.string() }), content: z.string(), comment_time: z.number() })) }).optional(),
});
export type GetJournalDetailResponse = z.infer<typeof GetJournalDetailResponseSchema>;

/**
 * 批量获取汇报记录单号
 * @see https://developer.work.weixin.qq.com/document/path/93474
 */
export const ListJournalRecordRequestSchema = z.object({
  /** 开始时间 [timestamp] */
  starttime: z.number(),
  /** 结束时间，开始时间和结束时间间隔不能超过一个月 [timestamp] */
  endtime: z.number(),
  /** 游标首次请求传0，非首次请求携带上一次请求返回的next_cursor */
  cursor: z.number().min(0).default(0),
  /** 拉取条数，一次拉取最多100个 */
  limit: z.number().min(1).max(100),
  /** 过滤条件 */
  filters: z.array(z.object({ key: z.string(), value: z.string().min(1).max(256) })).optional(),
});
export type ListJournalRecordRequest = z.infer<typeof ListJournalRecordRequestSchema>;
export const ListJournalRecordResponseSchema = z.object({
  /** 汇报记录id列表 */
  journaluuid_list: z.array(z.string()).optional(),
  /** 下一次拉取游标 */
  next_cursor: z.number().optional(),
  /** 0代表还有数据，1代表已无数据 */
  endflag: z.number().optional(),
});
export type ListJournalRecordResponse = z.infer<typeof ListJournalRecordResponseSchema>;

/**
 * 获取汇报统计数据
 * @see https://developer.work.weixin.qq.com/document/path/93475
 */
export const ListJournalStatRequestSchema = z.object({
  /** 汇报表单id */
  template_id: z.string().max(256),
  /** 开始时间 [timestamp] */
  starttime: z.number(),
  /** 结束时间，时间区间最大长度为一年 [timestamp] */
  endtime: z.number(),
});
export type ListJournalStatRequest = z.infer<typeof ListJournalStatRequestSchema>;
export const ListJournalStatResponseSchema = z.object({
  /** 统计数据列表 */
  stat_list: z.array(z.object({ template_id: z.string(), template_name: z.string(), report_range: z.object({ user_list: z.array(z.object({ userid: z.string() })), party_list: z.array(z.object({ open_partyid: z.string() })), tag_list: z.array(z.object({ open_tagid: z.string() })) }), white_range: z.object({ user_list: z.array(z.object({ userid: z.string() })), party_list: z.array(z.object({ open_partyid: z.string() })), tag_list: z.array(z.object({ open_tagid: z.string() })) }), receivers: z.object({ user_list: z.array(z.object({ userid: z.string() })), tag_list: z.array(z.object({ open_tagid: z.string() })), leader_list: z.array(z.object({ level: z.number() })) }), cycle_begin_time: z.number(), cycle_end_time: z.number(), stat_begin_time: z.number(), stat_end_time: z.number(), report_list: z.array(z.object({ user: z.object({ userid: z.string() }), itemlist: z.array(z.object({ journaluuid: z.string(), reporttime: z.string(), flag: z.number() })) })), unreport_list: z.array(z.object({ user: z.object({ userid: z.string() }), itemlist: z.array(z.object({ journaluuid: z.string(), reporttime: z.string(), flag: z.number() })) })), report_type: z.number() })).optional(),
});
export type ListJournalStatResponse = z.infer<typeof ListJournalStatResponseSchema>;

