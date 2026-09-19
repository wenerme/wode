// Code generated from Tencent Docs API documentation. DO NOT EDIT.
// Field names and requiredness are sourced from the linked @see pages.

type TencentDocsJsonObject = Record<string, unknown>;
type TencentDocsEmptyObject = Record<never, never>;

type TencentDocsSaasUser = {
  id?: string;
  type?: string;
  displayName?: string;
  avatar?: string;
  me?: boolean;
};

type TencentDocsSaasFileInfo = {
  meta?: {
    id?: string;
    parentId?: string;
    name?: string;
    type?: string;
    ext?: string;
    status?: string;
    url?: string;
  };
  entry?: {
    creator?: TencentDocsSaasUser;
    createTime?: string;
    owner?: TencentDocsSaasUser;
    lastModifyingUser?: TencentDocsSaasUser;
    modifiedTime?: string;
    sourceParentId?: string;
    deleteTime?: string;
    accessTime?: string;
    isFolder?: boolean;
    isLink?: boolean;
    isPin?: boolean;
    pinTime?: string;
    isStarred?: boolean;
    starredTime?: string;
  };
};

type TencentDocsPermission = {
  accessPolicy?: string;
  externalAccessPolicy?: string;
  members?: unknown[];
  setting?: TencentDocsJsonObject;
};

/** @see https://docs.qq.com/open/document/private/openapi/file/get_content.html */
export type GetFileContentResponse = {
  content?: string;
};

/** @see https://docs.qq.com/open/document/private/openapi/doc/get/get.html */
export type GetDocFileContentResponse = {
  document?: TencentDocsJsonObject;
  version?: number;
};

/** @see https://docs.qq.com/open/document/private/openapi/file/upload_attachment.html */
export type UploadAttachmentRequest = {
  attachment: File;
  fileID: string;
};

/** @see https://docs.qq.com/open/document/private/openapi/file/upload_attachment.html */
export type UploadAttachmentResponse = {
  objKey?: string;
};

/** @see https://docs.qq.com/open/document/private/openapi/admin/update_capacity_config.html */
export type UpdateCapacityConfigRequest = {
  capacityPerPerson: number;
};

/** @see https://docs.qq.com/open/document/private/openapi/admin/update_capacity_config.html */
export type UpdateCapacityConfigResponse = {
  succeed?: boolean;
};

/** @see https://docs.qq.com/open/document/private/openapi/admin/get_capacity.html */
export type GetCapacityInfoRequest = {
  userId: string;
  queryType: string;
};

/** @see https://docs.qq.com/open/document/private/openapi/admin/get_capacity.html */
export type GetCapacityInfoResponse = {
  usedCapacity?: TencentDocsJsonObject;
  totalCapacity?: TencentDocsJsonObject;
};

/** @see https://docs.qq.com/open/document/private/openapi/admin/update_user_capacity_limit.html */
export type UpdateUserCapacityLimitRequest = {
  userCapacity: TencentDocsJsonObject;
  updateType: string;
};

/** @see https://docs.qq.com/open/document/private/openapi/admin/get_hit_docs.html */
export type GetConfidentialHitDocsRequest = {
  id: string;
  type?: string;
  pageCookie?: string;
  pageSize?: number;
};

/** @see https://docs.qq.com/open/document/private/openapi/admin/get_hit_docs.html */
export type GetConfidentialHitDocsResponse = {
  count?: number;
  pageCookie?: string;
  hasMore?: boolean;
  docList?: unknown[];
};

/** @see https://docs.qq.com/open/document/private/openapi/admin/get_rules.html */
export type GetConfidentialRulesRequest = {
  pageIndex?: number;
  pageSize?: number;
};

/** @see https://docs.qq.com/open/document/private/openapi/admin/get_rules.html */
export type GetConfidentialRulesResponse = {
  totalPage?: number;
  rules?: unknown[];
};

/** @see https://docs.qq.com/open/document/private/openapi/admin/get_rule.html */
export type GetConfidentialRuleDetailResponse = {
  rule?: unknown;
};

/** @see https://docs.qq.com/open/document/private/openapi/admin/get_tags.html */
export type GetConfidentialTagsListRequest = {
  pageIndex?: number;
  pageSize?: number;
};

/** @see https://docs.qq.com/open/document/private/openapi/admin/get_tags.html */
export type GetConfidentialTagsListResponse = {
  totalPage?: number;
  tags?: unknown[];
};

/** @see https://docs.qq.com/open/document/private/openapi/admin/get_tag.html */
export type GetConfidentialTagDetailResponse = {
  tag?: unknown;
};

/** @see https://docs.qq.com/open/document/private/openapi/file/import.html */
export type ImportFileRequest = {
  file: File;
  folderId?: string;
};

/** @see https://docs.qq.com/open/document/private/openapi/file/import.html */
export type ImportFileResponse = {
  taskId?: string;
  type?: string;
};

/** @see https://docs.qq.com/open/document/private/openapi/file/search.html */
export type SearchFilesRequest = {
  keyword: string;
  field: string;
  offset: number;
  limit: number;
  directoryFileId?: string;
  extension?: unknown[];
  range?: TencentDocsJsonObject;
  source?: unknown[];
  isSpace?: boolean;
};

/** @see https://docs.qq.com/open/document/private/openapi/file/search.html */
export type SearchFilesResponse = {
  files?: TencentDocsJsonObject;
  next?: number;
  total?: string;
};

/** @see https://docs.qq.com/open/document/private/openapi/file/doc_convert_pdf.html */
export type ConvertAndExportPDFResponse = {
  taskId?: string;
  type?: string;
};

/** @see https://docs.qq.com/open/document/private/openapi/file/transowner_approve.html */
export type ApproveFileTransferRequest = {
  notifyId: string;
  status: string;
};

/** @see https://docs.qq.com/open/document/private/openapi/file/export.html */
export type ExportFileResponse = {
  taskId?: string;
  type?: string;
};

/** @see https://docs.qq.com/open/document/private/openapi/file/recover.html */
export type RecoverFileFilesResponse = TencentDocsSaasFileInfo;

/** @see https://docs.qq.com/open/document/private/openapi/permission/approve.html */
export type ApproveFilePermissionRequest = {
  applicantId: string;
  notifyId: string;
  rightFlag: number;
  status?: string;
};

/** @see https://docs.qq.com/open/document/private/openapi/file/uploadPic.html */
export type UploadImageRequest = {
  image: File;
};

/** @see https://docs.qq.com/open/document/private/openapi/file/uploadPic.html */
export type UploadImageResponse = {
  imageId?: string;
};

/** @see https://docs.qq.com/open/document/private/openapi/admin/recoverResignedEmployee.html */
export type RecoverResignedEmployeeRequest = {
  unionId: string;
  name: string;
  depIds: string[];
  phone?: string;
  email?: string;
  loginName?: string;
  loginPwd?: string;
  aliasId?: string;
  empNo?: string;
  position?: string;
  joinTime?: string;
};

/** @see https://docs.qq.com/open/document/private/openapi/admin/recoverResignedEmployee.html */
export type RecoverResignedEmployeeResponse = {
  isSuccess?: boolean;
  remark?: string;
};

/** @see https://docs.qq.com/open/document/private/openapi/admin/get_sharespace_limit_config.html */
export type GetShareSpaceLimitConfigResponse = {
  sharedSpaceLimit?: number;
  whiteList?: unknown[];
};

/** @see https://docs.qq.com/open/document/private/openapi/admin/update_sharespace_limit_config.html */
export type UpdateShareSpaceLimitConfigRequest = {
  updateType?: string;
  user?: TencentDocsJsonObject;
  limit?: string;
  customLimit?: number;
};

/** @see https://docs.qq.com/open/document/private/openapi/file/task.html */
export type GetTaskProgressRequest = {
  type: string;
};

/** @see https://docs.qq.com/open/document/private/openapi/file/task.html */
export type GetTaskProgressResponse = TencentDocsSaasFileInfo | { fileUrl?: string };

/** @see https://docs.qq.com/open/document/private/openapi/file/cancelTask.html */
export type CancelTaskRequest = {
  type: string;
};

/** @see https://docs.qq.com/open/document/private/openapi/smartcanvas/delete_element.html */
export type DeleteElementRequest = {
  elementIds: unknown[];
};

/** @see https://docs.qq.com/open/document/private/openapi/smartcanvas/get_element_info.html */
export type QueryElementInfoRequest = {
  request: unknown[];
};

/** @see https://docs.qq.com/open/document/private/openapi/smartcanvas/get_element_info.html */
export type QueryElementInfoResponse = {
  elementInfos?: unknown[];
};

/** @see https://docs.qq.com/open/document/private/openapi/smartcanvas/get_page_info.html */
export type GetPageInfoRequest = {
  pageId: string;
  cursor?: unknown[];
};

/** @see https://docs.qq.com/open/document/private/openapi/smartcanvas/get_page_info.html */
export type GetPageInfoResponse = {
  elementInfos?: unknown[];
  cursor?: unknown[];
  isOver?: boolean;
};

/** @see https://docs.qq.com/open/document/private/openapi/smartcanvas/create_page_by_template.html */
export type CreateTemplatePageRequest = {
  parentId?: string;
  after?: string;
  page: TencentDocsJsonObject;
  templateId?: string;
};

/** @see https://docs.qq.com/open/document/private/openapi/smartcanvas/create_page_by_template.html */
export type CreateTemplatePageResponse = {
  elementInfo?: TencentDocsJsonObject;
};

/** @see https://docs.qq.com/open/document/private/openapi/smartcanvas/get_first_level_pages.html */
export type GetTopPageInfoResponse = {
  elementInfos?: unknown[];
};

/** @see https://docs.qq.com/open/document/private/openapi/smartsheet/automation/execution_info.html */
export type GetFileWorkflowInfoRequest = {
  executionID: string;
};

/** @see https://docs.qq.com/open/document/private/openapi/smartsheet/automation/execution_info.html */
export type GetFileWorkflowInfoResponse = {
  execution?: TencentDocsJsonObject;
};

/** @see https://docs.qq.com/open/document/private/openapi/smartsheet/contentPermission/get_content_permission.html */
export type GetSheetContentPermissionRequest = {
  type: unknown;
  ruleIdList?: number[];
};

/** @see https://docs.qq.com/open/document/private/openapi/smartsheet/contentPermission/get_content_permission.html */
export type GetSheetContentPermissionResponse = {
  ruleList?: unknown[];
};

/** @see https://docs.qq.com/open/document/private/openapi/smartsheet/field/get.html */
export type ListFieldsRequest = {
  getFields: TencentDocsJsonObject;
};

/** @see https://docs.qq.com/open/document/private/openapi/smartsheet/field/get.html */
export type ListFieldsResponse = {
  ret?: number;
  msg?: string;
  data?: { getFields?: TencentDocsJsonObject; };
};

/** @see https://docs.qq.com/open/document/private/openapi/smartsheet/record/add.html */
export type AddRecordsRequest = {
  addRecords: TencentDocsJsonObject;
};

/** @see https://docs.qq.com/open/document/private/openapi/smartsheet/record/add.html */
export type AddRecordsResponse = {
  ret?: number;
  msg?: string;
  data?: { addRecords?: TencentDocsJsonObject; };
};

/** @see https://docs.qq.com/open/document/private/openapi/smartsheet/contentPermission/update_content_permission.html */
export type UpdateSheetContentPermissionRequest = {
  type: unknown;
  ruleId: number;
  privilegeList: unknown[];
};

/** @see https://docs.qq.com/open/document/private/openapi/space/search.html */
export type SearchSpaceDocumentsRequest = {
  pattern: string;
  queryBy?: number;
  descending?: boolean;
  num?: number;
};

/** @see https://docs.qq.com/open/document/private/openapi/space/search.html */
export type SearchSpaceDocumentsResponse = {
  result?: unknown[];
  hasNext?: boolean;
};

/** @see https://docs.qq.com/open/document/private/openapi/space/get_viewrange.html */
export type GetSpaceViewRangeResponse = {
  spaceId?: string;
  viewrange?: string;
};

/** @see https://docs.qq.com/open/document/private/openapi/space/create_space.html */
export type CreateSpaceRequest = {
  title: string;
  coverUrl?: string;
  description?: string;
  roleInfo: TencentDocsJsonObject;
};

/** @see https://docs.qq.com/open/document/private/openapi/space/create_space.html */
export type CreateSpaceResponse = {
  spaceId?: string;
};

/** @see https://docs.qq.com/open/document/private/openapi/space/space_info.html */
export type GetSpaceInfoResponse = {
  space?: TencentDocsJsonObject;
};

/** @see https://docs.qq.com/open/document/private/openapi/space/space_list.html */
export type ListSpacesRequest = {
  descending?: string;
  orderBy?: string;
  queryBy?: string;
  num?: number;
};

/** @see https://docs.qq.com/open/document/private/openapi/space/space_list.html */
export type ListSpacesResponse = {
  spaces?: unknown[];
};

/** @see https://docs.qq.com/open/document/private/openapi/space/create_node.html */
export type CreateSpaceNodeRequest = {
  spaceId: string;
  parentId: string;
  type: number;
  'wikiTdoc｜wikiFolder｜link': TencentDocsJsonObject;
};

/** @see https://docs.qq.com/open/document/private/openapi/space/create_node.html */
export type CreateSpaceNodeResponse = {
  nodeInfo?: TencentDocsJsonObject;
};

/** @see https://docs.qq.com/open/document/private/openapi/space/delete_node.html */
export type DeleteSpaceNodeRequest = {
  spaceId: string;
  nodeId: string;
  removeType: number;
};

/** @see https://docs.qq.com/open/document/private/openapi/space/querychild.html */
export type QuerySpaceChildNodesRequest = {
  spaceId: string;
  nodeId: string;
  num?: number;
};

/** @see https://docs.qq.com/open/document/private/openapi/space/querychild.html */
export type QuerySpaceChildNodesResponse = {
  children?: string;
  ancestors?: unknown[];
  hasNext?: boolean;
};

/** @see https://docs.qq.com/open/document/private/openapi/space/querytop.html */
export type QueryTopNodeResponse = {
  nodeInfos?: unknown[];
};

/** @see https://docs.qq.com/open/document/private/openapi/space/space_statistics.html */
export type GetSpaceStatisticsResponse = {
  totalSpaces?: string;
  spacesAddedYesterday?: string;
  totalSpaceUsers?: boolean;
  spaceUsersAccessedYesterday?: number;
  totalSpaceDocs?: string;
  spaceDocsAddedYesterday?: string;
};

/** @see https://docs.qq.com/open/document/private/openapi/sheet/get/get_sheet.html */
export type GetSpreadsheetInfoResponse = {
  properties?: unknown[];
};
