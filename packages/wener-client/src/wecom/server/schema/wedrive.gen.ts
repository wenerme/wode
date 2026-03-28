// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 新增成员
 * @see https://developer.work.weixin.qq.com/document/path/97893
 */
export const AddFileMemberRequestSchema = z.object({
  /** 文件fileid */
  fileid: z.string(),
  /** 添加成员的信息 */
  auth_info: z.array(z.object({ type: z.number(), userid: z.string(), departmentid: z.number().min(0).max(4294967295), auth: z.number() })),
});
export type AddFileMemberRequest = z.infer<typeof AddFileMemberRequestSchema>;

/**
 * 删除文件权限成员
 * @see https://developer.work.weixin.qq.com/document/path/97888
 */
export const DeleteMemberAclRequestSchema = z.object({
  /** 文件fileid */
  fileid: z.string(),
  /** 被移除的成员信息 */
  auth_info: z.array(z.object({ type: z.number(), userid: z.string(), departmentid: z.number().min(0).max(4294967295) })),
});
export type DeleteMemberAclRequest = z.infer<typeof DeleteMemberAclRequestSchema>;

/**
 * 新建文件夹/文档
 * @see https://developer.work.weixin.qq.com/document/path/97882
 */
export const CreateFileRequestSchema = z.object({
  /** 空间spaceid */
  spaceid: z.string(),
  /** 父目录fileid, 在根目录时为空间spaceid */
  fatherid: z.string(),
  /** 文件类型 (1-文件夹, 3-文档(文档), 4-文档(表格)) */
  file_type: z.number(),
  /** 文件名字（注意：文件名最多填255个字符，英文算1个，汉字算2个） */
  file_name: z.string().min(1).max(255),
});
export type CreateFileRequest = z.infer<typeof CreateFileRequestSchema>;
export const CreateFileResponseSchema = z.object({
  /** 新建文件的fileid */
  fileid: z.string().optional(),
  /** 文档的访问链接，仅在新建文档时返回 */
  url: z.string().optional(),
});
export type CreateFileResponse = z.infer<typeof CreateFileResponseSchema>;

/**
 * 删除文件
 * @see https://developer.work.weixin.qq.com/document/path/97885
 */
export const DeleteFileRequestSchema = z.object({
  /** 文件fileid */
  fileid: z.array(z.string()),
});
export type DeleteFileRequest = z.infer<typeof DeleteFileRequestSchema>;

/**
 * 下载文件
 * @see https://developer.work.weixin.qq.com/document/path/97881
 */
export const DownloadFileRequestSchema = z.object({
  /** 文件fileid（只支持下载普通文件，不支持下载文件夹或微文档） */
  fileid: z.string().optional(),
  /** 微盘和文件选择器jsapi返回的selectedTicket。若填此参数，则不需要填fileid。 */
  selected_ticket: z.string().optional(),
});
export type DownloadFileRequest = z.infer<typeof DownloadFileRequestSchema>;
export const DownloadFileResponseSchema = z.object({
  /** 下载请求url (有效期2个小时) */
  download_url: z.string().optional(),
  /** 下载请求带cookie的key */
  cookie_name: z.string().optional(),
  /** 下载请求带cookie的value */
  cookie_value: z.string().optional(),
});
export type DownloadFileResponse = z.infer<typeof DownloadFileResponseSchema>;

/**
 * 获取文件信息
 * @see https://developer.work.weixin.qq.com/document/path/97886
 */
export const GetDriveFileInfoRequestSchema = z.object({
  /** 文件fileid */
  fileid: z.string(),
});
export type GetDriveFileInfoRequest = z.infer<typeof GetDriveFileInfoRequestSchema>;
export const GetDriveFileInfoResponseSchema = z.object({
  /** 文件信息对象 */
  file_info: z.object({ fileid: z.string(), file_name: z.string(), spaceid: z.string(), fatherid: z.string(), file_size: z.number(), ctime: z.number(), mtime: z.number(), file_type: z.number(), file_status: z.number(), sha: z.string(), md5: z.string(), url: z.string() }).optional(),
});
export type GetDriveFileInfoResponse = z.infer<typeof GetDriveFileInfoResponseSchema>;

/**
 * 获取文件列表
 * @see https://developer.work.weixin.qq.com/document/path/97887
 */
export const ListDriveFileRequestSchema = z.object({
  /** 空间spaceid */
  spaceid: z.string().min(1),
  /** 当前目录的fileid，根目录时为空间spaceid */
  fatherid: z.string().min(1),
  /** 列表排序方式 (1-名字升序, 2-名字降序, 3-大小升序, 4-大小降序, 5-修改时间升序, 6-修改时间降序) */
  sort_type: z.number(),
  /** 首次填0，后续填上一次请求返回的next_start */
  start: z.number().min(0),
  /** 分批拉取最大文件数 */
  limit: z.number().min(1).max(1000),
});
export type ListDriveFileRequest = z.infer<typeof ListDriveFileRequestSchema>;
export const ListDriveFileResponseSchema = z.object({
  /** true为列表还有内容，需要继续分批拉取 */
  has_more: z.boolean().optional(),
  /** 下次分批拉取对应的请求参数start值 */
  next_start: z.number().min(0).optional(),
  /** 文件列表对象 */
  file_list: z.object({ item: z.array(z.object({ fileid: z.string().min(1), file_name: z.string().min(1), spaceid: z.string().min(1), fatherid: z.string().min(1), file_size: z.number().min(0), ctime: z.number().min(0), mtime: z.number().min(0), file_type: z.number(), file_status: z.number(), sha: z.string(), md5: z.string(), url: z.string() })) }).optional(),
});
export type ListDriveFileResponse = z.infer<typeof ListDriveFileResponseSchema>;

/**
 * 移动文件
 * @see https://developer.work.weixin.qq.com/document/path/97884
 */
export const MoveFileRequestSchema = z.object({
  /** 当前目录的fileid，根目录时为空间spaceid */
  fatherid: z.string(),
  /** 如果移动到的目标目录与需要移动的文件重名时，是否覆盖。true:重名文件覆盖 false:重名文件进行冲突重命名处理 (true-覆盖, false-冲突重命名) */
  replace: z.boolean().optional(),
  /** 文件fileid列表 */
  fileid: z.array(z.string()),
});
export type MoveFileRequest = z.infer<typeof MoveFileRequestSchema>;
export const MoveFileResponseSchema = z.object({
  /** 移动文件的信息列表 */
  file_list: z.object({ item: z.array(z.object({ fileid: z.string(), file_name: z.string(), spaceid: z.string(), fatherid: z.string(), file_size: z.number(), ctime: z.number(), mtime: z.number(), file_type: z.number(), file_status: z.number(), sha: z.string(), md5: z.string() })) }).optional(),
});
export type MoveFileResponse = z.infer<typeof MoveFileResponseSchema>;

/**
 * 重命名文件
 * @see https://developer.work.weixin.qq.com/document/path/97883
 */
export const RenameFileRequestSchema = z.object({
  /** 文件fileid */
  fileid: z.string(),
  /** 重命名后的文件名（注意：文件名最多填255个字符，英文算1个，汉字算2个） */
  new_name: z.string().max(255),
});
export type RenameFileRequest = z.infer<typeof RenameFileRequestSchema>;
export const RenameFileResponseSchema = z.object({
  /** 文件信息 */
  file: z.object({ fileid: z.string(), file_name: z.string(), spaceid: z.string(), fatherid: z.string(), file_size: z.number(), ctime: z.number(), mtime: z.number(), file_type: z.number(), file_status: z.number(), sha: z.string(), md5: z.string() }).optional(),
});
export type RenameFileResponse = z.infer<typeof RenameFileResponseSchema>;

/**
 * 修改文件安全设置
 * @see https://developer.work.weixin.qq.com/document/path/97892
 */
export const UpdateFileSecureSettingRequestSchema = z.object({
  /** 文件fileid */
  fileid: z.string(),
  /** 水印设置对象 */
  watermark: z.object({ text: z.string(), margin_type: z.number(), show_visitor_name: z.boolean(), show_text: z.boolean() }).optional(),
});
export type UpdateFileSecureSettingRequest = z.infer<typeof UpdateFileSecureSettingRequestSchema>;

/**
 * 分享设置
 * @see https://developer.work.weixin.qq.com/document/path/97889
 */
export const SetFileShareSettingRequestSchema = z.object({
  /** 文件fileid */
  fileid: z.string(),
  /** 权限范围：1:指定人 2:企业内 3:企业外 4: 企业内需管理员审批（仅有管理员时可设置）5: 企业外需管理员审批（仅有管理员时可设置） (1-指定人, 2-企业内, 3-企业外, 4-企业内需管理员审批, 5-企业外需管理员审批) */
  auth_scope: z.number(),
  /** 权限信息。普通文档：1:仅浏览（可下载) 4:仅预览（仅专业版企业可设置）；微文档：1:仅浏览（可下载）。如果不填充此字段为保持原有状态 (1-仅浏览（可下载）, 4-仅预览) */
  auth: z.number().optional(),
});
export type SetFileShareSettingRequest = z.infer<typeof SetFileShareSettingRequestSchema>;

/**
 * 获取分享链接
 * @see https://developer.work.weixin.qq.com/document/path/97890
 */
export const GetFileShareUrlRequestSchema = z.object({
  /** 文件fileid */
  fileid: z.string(),
});
export type GetFileShareUrlRequest = z.infer<typeof GetFileShareUrlRequestSchema>;
export const GetFileShareUrlResponseSchema = z.object({
  /** 分享文件的链接 */
  share_url: z.string().optional(),
});
export type GetFileShareUrlResponse = z.infer<typeof GetFileShareUrlResponseSchema>;

/**
 * 上传文件
 * @see https://developer.work.weixin.qq.com/document/path/97880
 */
export const UploadFileRequestSchema = z.object({
  /** 空间spaceid */
  spaceid: z.string().optional(),
  /** 父目录fileid，在根目录时为空间spaceid */
  fatherid: z.string().optional(),
  /** 微盘和文件选择器jsapi返回的selectedTicket。若填此参数，则不需要填spaceid/fatherid */
  selected_ticket: z.string().optional(),
  /** 文件名字（注意：文件名最多填255个字符，英文算1个，汉字算2个） */
  file_name: z.string().min(1).max(255),
  /** 文件内容base64（注意：只需要填入文件内容的Base64，不需要添加任何如data:application/x-javascript;base64的数据类型 [base64] */
  file_base64_content: z.string().min(1),
});
export type UploadFileRequest = z.infer<typeof UploadFileRequestSchema>;
export const UploadFileResponseSchema = z.object({
  /** 新建文件的fileid */
  fileid: z.string().optional(),
});
export type UploadFileResponse = z.infer<typeof UploadFileResponseSchema>;

/**
 * 文件分块上传初始化
 * @see https://developer.work.weixin.qq.com/document/path/98004
 */
export const InitWedriveFileUploadRequestSchema = z.object({
  /** 空间spaceid */
  spaceid: z.string().optional(),
  /** 当前目录的fileid，根目录时为空间spaceid */
  fatherid: z.string().optional(),
  /** 微盘和文件选择器jsapi返回的selectedTicket。若填此参数，则不需要填spaceid/fatherid */
  selected_ticket: z.string().optional(),
  /** 文件名字 */
  file_name: z.string().min(1),
  /** 文件大小。最大支持20G */
  size: z.number().min(1).max(21474836480),
  /** 文件分块累积sha值，按分块顺序填入数组 */
  block_sha: z.array(z.string()),
  /** 文件创建完成时是否推送企业微信卡片。默认false，即默认推送卡片 */
  skip_push_card: z.boolean().default(false).optional(),
});
export type InitWedriveFileUploadRequest = z.infer<typeof InitWedriveFileUploadRequestSchema>;
export const InitWedriveFileUploadResponseSchema = z.object({
  /** 是否命中秒传 */
  hit_exist: z.boolean().optional(),
  /** 文件上传凭证。不命中秒传时返回，作为file_upload_part参数 */
  upload_key: z.string().optional(),
  /** 文件fileid。命中秒传时返回，此时上传流程完成 */
  fileid: z.string().optional(),
});
export type InitWedriveFileUploadResponse = z.infer<typeof InitWedriveFileUploadResponseSchema>;

/**
 * 获取文件权限信息
 * @see https://developer.work.weixin.qq.com/document/path/97891
 */
export const GetFilePermissionRequestSchema = z.object({
  /** 文件fileid */
  fileid: z.string(),
});
export type GetFilePermissionRequest = z.infer<typeof GetFilePermissionRequestSchema>;
export const GetFilePermissionResponseSchema = z.object({
  /** 文件分享设置 */
  share_range: z.object({ enable_corp_internal: z.boolean(), corp_internal_auth: z.number(), enable_corp_external: z.boolean(), corp_external_auth: z.number() }).optional(),
  /** 文件安全配置 */
  secure_setting: z.object({ enable_readonly_copy: z.boolean(), modify_only_by_admin: z.boolean(), enable_readonly_comment: z.boolean(), ban_share_external: z.boolean() }).optional(),
  /** 从文件父路径继承的权限 */
  inherit_father_auth: z.object({ inherit: z.boolean(), auth_list: z.array(z.object({ type: z.number(), userid: z.string(), auth: z.number() })) }).optional(),
  /** 查询fileid为文档时返回，为文档所在目录成员，以及其他授权列表 */
  file_member_list: z.array(z.object({ type: z.number(), userid: z.string(), auth: z.number() })).optional(),
  /** 水印相关设置 */
  watermark: z.object({ text: z.string(), margin_type: z.number(), show_visitor_name: z.boolean(), force_by_admin: z.boolean(), show_text: z.boolean(), force_by_space_admin: z.boolean() }).optional(),
});
export type GetFilePermissionResponse = z.infer<typeof GetFilePermissionResponseSchema>;

export const GetWeDriveProInfoResponseSchema = z.object({
  /** true为专业版，false为不是专业版 */
  is_pro: z.boolean().optional(),
  /** 总的vip账号数量 */
  total_vip_acct_num: z.number().optional(),
  /** 已使用的vip账号数量 */
  use_vip_acct_num: z.number().optional(),
  /** 专业版到期时间，时间戳，精确到秒 */
  pro_expire_time: z.number().optional(),
});
export type GetWeDriveProInfoResponse = z.infer<typeof GetWeDriveProInfoResponseSchema>;

/**
 * 获取空间信息
 * @see https://developer.work.weixin.qq.com/document/path/97878
 */
export const GetSpaceInfoRequestSchema = z.object({
  /** 空间spaceid */
  spaceid: z.string(),
});
export type GetSpaceInfoRequest = z.infer<typeof GetSpaceInfoRequestSchema>;
export const GetSpaceInfoResponseSchema = z.object({
  /** 空间信息 */
  space_info: z.object({ spaceid: z.string(), space_name: z.string(), auth_list: z.object({ auth_info: z.array(z.object({ type: z.number(), userid: z.string(), departmentid: z.string(), auth: z.number() })), quit_userid: z.array(z.string()) }), space_sub_type: z.number(), secure_setting: z.object({ enable_watermark: z.boolean(), add_member_only_admin: z.boolean(), enable_share_url: z.boolean(), share_url_no_approve: z.boolean(), share_url_no_approve_default_auth: z.number(), enable_share_external: z.boolean(), enable_share_external_admin: z.boolean(), enable_space_add_external_member: z.boolean(), enable_space_add_external_member_admin: z.boolean(), enable_confidential_mode: z.boolean(), default_file_scope: z.number(), create_file_only_admin: z.boolean() }) }).optional(),
});
export type GetSpaceInfoResponse = z.infer<typeof GetSpaceInfoResponseSchema>;

/**
 * 添加成员/部门
 * @see https://developer.work.weixin.qq.com/document/path/97879
 */
export const AddSpaceMemberDepartmentRequestSchema = z.object({
  /** 空间spaceid */
  spaceid: z.string(),
  /** 被添加的空间成员信息 */
  auth_info: z.array(z.object({ type: z.number(), userid: z.string().min(1).max(64), departmentid: z.number().min(0).max(4294967295), auth: z.number() })),
});
export type AddSpaceMemberDepartmentRequest = z.infer<typeof AddSpaceMemberDepartmentRequestSchema>;

/**
 * 移除成员/部门
 * @see https://developer.work.weixin.qq.com/document/path/97875
 */
export const RemoveSpaceMemberOrDeptRequestSchema = z.object({
  /** 空间spaceid */
  spaceid: z.string(),
  /** 被移除的空间成员信息 */
  auth_info: z.array(z.object({ type: z.number(), userid: z.string().min(1), departmentid: z.number().min(0).max(4294967295) })),
});
export type RemoveSpaceMemberOrDeptRequest = z.infer<typeof RemoveSpaceMemberOrDeptRequestSchema>;

/**
 * 新建空间
 * @see https://developer.work.weixin.qq.com/document/path/97860
 */
export const CreateSpaceRequestSchema = z.object({
  /** 空间标题 */
  space_name: z.string().min(1).max(64),
  /** 空间其他成员信息 */
  auth_info: z.array(z.object({ type: z.number(), userid: z.string().min(1).max(64), departmentid: z.number().min(0).max(4294967295), auth: z.number() })).optional(),
  /** 区分创建空间类型，0:普通（目前只支持0） (0-普通) */
  space_sub_type: z.number().optional(),
});
export type CreateSpaceRequest = z.infer<typeof CreateSpaceRequestSchema>;
export const CreateSpaceResponseSchema = z.object({
  /** 空间id */
  spaceid: z.string().optional(),
});
export type CreateSpaceResponse = z.infer<typeof CreateSpaceResponseSchema>;

/**
 * 解散空间
 * @see https://developer.work.weixin.qq.com/document/path/97857
 */
export const DismissSpaceRequestSchema = z.object({
  /** 空间spaceid */
  spaceid: z.string(),
});
export type DismissSpaceRequest = z.infer<typeof DismissSpaceRequestSchema>;

/**
 * 重命名空间
 * @see https://developer.work.weixin.qq.com/document/path/97856
 */
export const RenameSpaceRequestSchema = z.object({
  /** 空间spaceid */
  spaceid: z.string(),
  /** 重命名后的空间名 */
  space_name: z.string(),
});
export type RenameSpaceRequest = z.infer<typeof RenameSpaceRequestSchema>;

/**
 * 安全设置
 * @see https://developer.work.weixin.qq.com/document/path/97876
 */
export const UpdateSpaceSettingRequestSchema = z.object({
  /** 空间spaceid */
  spaceid: z.string(),
  /** （本字段仅专业版企业可设置）启用水印。false:关 true:开 ;如果不填充此字段为保持原有状态 (false-关, true-开) */
  enable_watermark: z.boolean().optional(),
  /** 是否开启保密模式。false:关 true:开 如果不填充此字段为保持原有状态 (false-关, true-开) */
  enable_confidential_mode: z.boolean().optional(),
  /** 通过链接加入空间无需审批。false:关； true:开； 如果不填充此字段为保持原有状态 (false-关, true-开) */
  share_url_no_approve: z.boolean().optional(),
  /** 邀请链接默认权限。1:仅下载 2:可编辑 4:仅预览 5:可上传下载 200:自定义权限；如果不填充此字段为保持原有状态 (1-仅下载, 2-可编辑, 4-仅预览, 5-可上传下载, 200-自定义权限) */
  share_url_no_approve_default_auth: z.number().optional(),
  /** 文件默认可查看范围。1:仅成员；2:企业内。如果不填充此字段为保持原有状态 (1-仅成员, 2-企业内) */
  default_file_scope: z.number().optional(),
  /** 是否禁止文件分享到企业外｜false:关 true:开 如果不填充此字段为保持原有状态 (false-关, true-开) */
  ban_share_external: z.boolean().optional(),
});
export type UpdateSpaceSettingRequest = z.infer<typeof UpdateSpaceSettingRequestSchema>;

/**
 * 获取邀请链接
 * @see https://developer.work.weixin.qq.com/document/path/97877
 */
export const GetSpaceShareLinkRequestSchema = z.object({
  /** 空间spaceid */
  spaceid: z.string(),
});
export type GetSpaceShareLinkRequest = z.infer<typeof GetSpaceShareLinkRequestSchema>;
export const GetSpaceShareLinkResponseSchema = z.object({
  /** 邀请链接 */
  space_share_url: z.string().optional(),
});
export type GetSpaceShareLinkResponse = z.infer<typeof GetSpaceShareLinkResponseSchema>;

/**
 * 分配高级功能账号
 * @see https://developer.work.weixin.qq.com/document/path/99512
 */
export const BatchAddDriveVipRequestSchema = z.object({
  /** 要分配高级功能的企业成员userid列表 */
  userid_list: z.array(z.string()),
});
export type BatchAddDriveVipRequest = z.infer<typeof BatchAddDriveVipRequestSchema>;
export const BatchAddDriveVipResponseSchema = z.object({
  /** 分配成功的userid列表，包括已经是高级功能账号的userid */
  succ_userid_list: z.array(z.string()).optional(),
  /** 分配失败的userid列表 */
  fail_userid_list: z.array(z.string()).optional(),
});
export type BatchAddDriveVipResponse = z.infer<typeof BatchAddDriveVipResponseSchema>;

/**
 * 取消高级功能账号
 * @see https://developer.work.weixin.qq.com/document/path/99513
 */
export const BatchDelDriveVipRequestSchema = z.object({
  /** 要撤销分配高级功能的企业成员userid列表 */
  userid_list: z.array(z.string()),
});
export type BatchDelDriveVipRequest = z.infer<typeof BatchDelDriveVipRequestSchema>;
export const BatchDelDriveVipResponseSchema = z.object({
  /** 撤销分配成功的userid列表 */
  succ_userid_list: z.array(z.string()).optional(),
  /** 撤销分配失败的userid列表 */
  fail_userid_list: z.array(z.string()).optional(),
});
export type BatchDelDriveVipResponse = z.infer<typeof BatchDelDriveVipResponseSchema>;

/**
 * 获取高级功能账号列表
 * @see https://developer.work.weixin.qq.com/document/path/99514
 */
export const ListDriveVipRequestSchema = z.object({
  /** 用于分页查询的游标，字符串类型，由上一次调用返回，首次调用可不填 */
  cursor: z.string().optional(),
  /** 用于分页查询，每次请求返回的数据上限。默认100，最大200 */
  limit: z.number().min(1).max(200).default(100).optional(),
});
export type ListDriveVipRequest = z.infer<typeof ListDriveVipRequestSchema>;
export const ListDriveVipResponseSchema = z.object({
  /** 是否还有更多数据未获取 */
  has_more: z.boolean().optional(),
  /** 下一次请求的cursor值 */
  next_cursor: z.string().optional(),
  /** 符合条件的企业成员userid列表 */
  userid_list: z.array(z.string()).optional(),
});
export type ListDriveVipResponse = z.infer<typeof ListDriveVipResponseSchema>;

