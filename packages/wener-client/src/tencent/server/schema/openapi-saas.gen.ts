// Code generated from Tencent Docs API documentation. DO NOT EDIT.
// Field names and requiredness are sourced from the linked @see pages.

type TencentDocsJsonObject = Record<string, unknown>;
type TencentDocsEmptyObject = Record<never, never>;

export type TencentDocsSaasUser = {
  id?: string;
  type?: string;
  displayName?: string;
  avatar?: string;
  me?: boolean;
};

export type TencentDocsSaasFileInfo = {
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

/** @see https://docs.qq.com/open/document/saas/openapi/file/create.html */
export type CreateFileRequest = {
  name: string;
  type: string;
  folderId?: string;
  templateId?: string;
  hasChangeName?: boolean;
};

/** @see https://docs.qq.com/open/document/saas/openapi/file/create.html */
export type CreateFileResponse = TencentDocsSaasFileInfo;

/** @see https://docs.qq.com/open/document/saas/openapi/file/list.html */
export type ListFilesRequest = {
  listType: string;
  offset?: number;
  limit?: number;
  orderBy?: string;
  desc?: boolean;
  parentId?: string;
  extension?: unknown[];
  createSource?: string;
  shareSource?: string;
  deleteType?: string;
};

/** @see https://docs.qq.com/open/document/saas/openapi/file/list.html */
export type ListFilesResponse = {
  files?: TencentDocsSaasFileInfo[];
  next?: number;
};

/** @see https://docs.qq.com/open/document/saas/openapi/file/upload.html */
export type UploadFileRequest = {
  file: File;
  folderId?: string;
};

/** @see https://docs.qq.com/open/document/saas/openapi/file/upload.html */
export type UploadFileResponse = {
  taskId?: string;
  type?: string;
};

/** @see https://docs.qq.com/open/document/saas/openapi/file/delete.html */
export type DeleteFileResponse = TencentDocsEmptyObject;

/** @see https://docs.qq.com/open/document/saas/openapi/file/copy.html */
export type CopyFileRequest = {
  name?: string;
  folderId?: string;
};

/** @see https://docs.qq.com/open/document/saas/openapi/file/copy.html */
export type CopyFileResponse = TencentDocsSaasFileInfo;

/** @see https://docs.qq.com/open/document/saas/openapi/file/download.html */
export type DownloadFileResponse = {
  taskId?: string;
  type?: string;
};

/** @see https://docs.qq.com/open/document/saas/openapi/file/move.html */
export type MoveFileFilesRequest = {
  folderId: string;
};

/** @see https://docs.qq.com/open/document/saas/openapi/file/move.html */
export type MoveFileFilesResponse = TencentDocsSaasFileInfo;

/** @see https://docs.qq.com/open/document/saas/openapi/permission/get.html */
export type GetFilePermissionsResponse = TencentDocsPermission;

/** @see https://docs.qq.com/open/document/saas/openapi/permission/access.html */
export type GetFileAccessPermissionRequest = {
  actions: string[];
};

/** @see https://docs.qq.com/open/document/saas/openapi/permission/access.html */
export type GetFileAccessPermissionResponse = {
  grantedActions?: TencentDocsJsonObject;
  deniedActions?: TencentDocsJsonObject;
};

/** @see https://docs.qq.com/open/document/saas/openapi/smartsheet/automation/get.html */
export type GetSmartsheetWorkflowConfigResponse = {
  workflow?: TencentDocsJsonObject;
};

/** @see https://docs.qq.com/open/document/saas/openapi/smartsheet/automation/execution_list.html */
export type BatchQueryExecutionRecordsRequest = {
  executionID: string;
  status?: number[];
  logStartTime: string;
  logEndTime: string;
  pageNum: number;
  pageSize: number;
  durationLower?: number;
  durationUpper?: number;
  logTimeAsc?: boolean;
};

/** @see https://docs.qq.com/open/document/saas/openapi/smartsheet/automation/execution_list.html */
export type BatchQueryExecutionRecordsResponse = {
  execution?: TencentDocsJsonObject;
  totalCount?: string;
  nextPage?: number;
  isEnd?: boolean;
};

/** @see https://docs.qq.com/open/document/saas/openapi/smartsheet/contentPermission/add_extra_permission.html */
export type AddExtraPermissionRequest = {
  name: string;
};

/** @see https://docs.qq.com/open/document/saas/openapi/smartsheet/contentPermission/add_extra_permission.html */
export type AddExtraPermissionResponse = {
  ruleId?: number;
};

/** @see https://docs.qq.com/open/document/saas/openapi/smartsheet/contentPermission/delete_extra_permission.html */
export type DeleteFileExtraPermissionRequest = {
  ruleId: number;
};

/** @see https://docs.qq.com/open/document/saas/openapi/smartsheet/sheet/get.html */
export type GetSheetsResponse = TencentDocsEmptyObject;

/** @see https://docs.qq.com/open/document/saas/openapi/smartsheet/field/add.html */
export type AddFieldsRequest = {
  addFields: TencentDocsJsonObject;
};

/** @see https://docs.qq.com/open/document/saas/openapi/smartsheet/field/add.html */
export type AddFieldsResponse = TencentDocsEmptyObject;

/** @see https://docs.qq.com/open/document/saas/openapi/smartsheet/record/get.html */
export type ListRecordsRequest = {
  getRecords: TencentDocsJsonObject;
};

/** @see https://docs.qq.com/open/document/saas/openapi/smartsheet/record/get.html */
export type ListRecordsResponse = {
  ret?: number;
  msg?: string;
  data?: { getRecords?: TencentDocsJsonObject; };
};

/** @see https://docs.qq.com/open/document/saas/openapi/smartsheet/view/add.html */
export type AddViewRequest = {
  addView: TencentDocsJsonObject;
};

/** @see https://docs.qq.com/open/document/saas/openapi/smartsheet/view/add.html */
export type AddViewResponse = TencentDocsEmptyObject;

/** @see https://docs.qq.com/open/document/saas/openapi/smartsheet/contentPermission/update_member_extra_permission.html */
export type UpdateFileMemberExtraPermissionRequest = {
  ruleId: number;
  addMembers?: unknown[];
  delMembers?: unknown[];
};
