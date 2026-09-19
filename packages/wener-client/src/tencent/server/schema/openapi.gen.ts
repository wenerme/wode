// Code generated from Tencent Docs API documentation. DO NOT EDIT.
// Field names and requiredness are sourced from the linked @see pages.

export type TencentDocsJsonObject = Record<string, unknown>;
export type TencentDocsEmptyObject = Record<never, never>;

/** 文档信息（来源：腾讯文档开放平台“文件信息”页面）。 */
export type TencentDocsFileInfo = {
  ID?: string;
  title?: string;
  type?: string;
  url?: string;
  status?: string;
  isCreator?: boolean;
  createTime?: number;
  creatorName?: string;
  isOwner?: boolean;
  ownerName?: string;
  lastModifyTime?: number;
  lastModifyName?: string;
  relativeFiles?: unknown[];
  formCollectingStatus?: string;
  formCollectingEndTime?: number;
};

/** @see https://docs.qq.com/open/document/app/openapi/v3/doc/get/get_in.html */
export type GetWecomDocContentResponse = {
  document?: TencentDocsJsonObject;
  version?: number;
};

/** @see https://docs.qq.com/open/document/app/openapi/v3/doc/batchupdate/update.html */
export type BatchUpdateDocContentRequest = {
  requests: TencentDocsJsonObject;
  version?: number;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/thumbnail/get_thumbnail_result.html */
export type ConfirmDriveAddonThumbnailUploadRequest = {
  objKey: string;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/files/create.html */
export type CreateFileFilesRequest = {
  title: string;
  type: string;
  templateID?: string;
  templateVersion?: string;
  folderID?: string;
  ext?: string;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/files/create.html */
export type CreateFileFilesResponse = {
  ret?: number;
  msg?: string;
  data?: TencentDocsFileInfo;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/files/delete.html */
export type DeleteFileFilesRequest = {
  type?: string;
  recoverable?: number;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/files/access.html */
export type GetFileAccessResponse = {
  ret?: number;
  msg?: string;
  data?: { isOwner?: boolean; readEnable?: boolean; editEnable?: boolean; downloadEnable?: boolean; cloneEnable?: boolean; watermarkEnable?: boolean; };
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/export/async_export.html */
export type AsyncExportFileRequest = {
  exportType?: string;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/export/async_export.html */
export type AsyncExportFileResponse = {
  ret?: number;
  msg?: string;
  data?: { operationID?: string; };
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/files/clone/clone_key.html */
export type GetFileCloneKeyRequest = {
  targetOpenID: string;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/files/clone/clone_key.html */
export type GetFileCloneKeyResponse = {
  ret?: number;
  msg?: string;
  data?: { fileCloneKey?: string; };
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/files/collaborators/delete.html */
export type DeleteCollaboratorRequest = {
  type: string;
  id: string;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/files/copy.html */
export type CreateFileCopyRequest = {
  title: string;
  folderID?: string;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/files/copy.html */
export type CreateFileCopyResponse = {
  ret?: number;
  msg?: string;
  data?: TencentDocsFileInfo;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/export/export_in.html */
export type ExportFileExportResponse = {
  ret?: number;
  msg?: string;
  data?: { fileSize?: number; url?: string; expireIn?: number; };
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/export/export_progress.html */
export type GetExportProgressRequest = {
  operationID: string;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/export/export_progress.html */
export type GetExportProgressResponse = {
  ret?: number;
  msg?: string;
  data?: { url?: string; progress?: number; };
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/files/members/get_in.html */
export type GetFileMembersResponse = {
  ret?: number;
  msg?: string;
  data?: { members?: Array<{ type?: string; id?: string; access?: string; }>; };
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/files/members/delete_in.html */
export type DeleteFileMembersRequest = {
  type: string;
  members: string;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/files/metadata.html */
export type GetFileMetadataResponse = {
  ret?: number;
  msg?: string;
  data?: TencentDocsFileInfo;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/files/move.html */
export type MoveFileRequest = {
  targetfolderID: string;
  parentfolderID: string;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/files/ownership.html */
export type TransferFileOwnershipRequest = {
  ownerID: string;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/files/permission/get.html */
export type GetFilePermissionResponse = {
  ret?: number;
  msg?: string;
  data?: { policy?: string; copyEnabled?: boolean; readerCommentEnabled?: boolean; writerCommentEnabled?: boolean; };
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/files/permission/apply.html */
export type ApplyFilePermissionRequest = {
  type: string;
  memo?: string;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/files/pin.html */
export type PinFileRequest = {
  pin: number;
  folderID?: string;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/files/presentation/create_in.html */
export type CreatePresentationRoomRequest = {
  host?: string;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/files/presentation/create_in.html */
export type CreatePresentationRoomResponse = {
  ret?: number;
  msg?: string;
  data?: { roomID?: string; createTime?: number; audienceURL?: string; presenterURL?: string; };
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/files/shortcut.html */
export type CreateShortcutRequest = {
  targetfolderID?: string;
  shareKey?: string;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/files/star.html */
export type StarFileRequest = {
  star: number;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/files/watermark/set.html */
export type SetWatermarkRequest = {
  text?: string;
  visitorMark: number;
  margin: string;
  hideFromOwner: number;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/files/webpublish/get.html */
export type GetFileWebPublishResponse = {
  ret?: number;
  msg?: string;
  data?: { publishURL?: string; };
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/import/async_import.html */
export type AsyncImportFileRequest = {
  fileMD5: string;
  fileName: string;
  parentfolderID?: string;
  filePassword?: string;
  COSFileKey: string;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/import/async_import.html */
export type AsyncImportFileResponse = {
  ret?: number;
  msg?: string;
  data?: { progressQueryID?: string; };
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/files/clone/clone.html */
export type CloneFileRequest = {
  fileCloneKey: string;
  title: string;
  folderID?: string;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/files/clone/clone.html */
export type CloneFileResponse = {
  ret?: number;
  msg?: string;
  data?: TencentDocsFileInfo;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/import/import_in.html */
export type ImportFileImportRequest = {
  fileMD5: string;
  fileName: string;
  parentfolderID?: string;
  filePassword?: string;
  COSFileKey: string;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/import/import_in.html */
export type ImportFileImportResponse = {
  ret?: number;
  msg?: string;
  data?: TencentDocsFileInfo;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/import/import_progress.html */
export type GetImportProgressRequest = {
  progressQueryID: string;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/import/import_progress.html */
export type GetImportProgressResponse = {
  ret?: number;
  msg?: string;
  data?: { ID?: string; title?: string; type?: string; url?: string; progress?: number; };
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/import/cos_sdk_pre_import_in.html */
export type PreImportFileRequest = {
  fileMD5: string;
  fileName: string;
  fileSize: number;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/import/cos_sdk_pre_import_in.html */
export type PreImportFileResponse = {
  ret?: number;
  msg?: string;
  data?: TencentDocsJsonObject;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/import/pre_import.html */
export type CreateFileUploadInfoRequest = {
  fileMD5: string;
  fileName: string;
  fileSize: number;
  uploadType?: string;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/import/pre_import.html */
export type CreateFileUploadInfoResponse = {
  ret?: number;
  msg?: string;
  data?: TencentDocsJsonObject;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/filter/filter.html */
export type GetFilterRequest = {
  listType?: string;
  sortType?: string;
  asc?: number;
  folderID?: string;
  start?: number;
  limit?: number;
  isOwner?: number;
  fileType?: string;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/filter/filter.html */
export type GetFilterResponse = {
  ret?: number;
  msg?: string;
  data?: TencentDocsJsonObject;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/folders/add.html */
export type CreateFolderRequest = {
  title: string;
  parentfolderID?: string;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/folders/add.html */
export type CreateFolderResponse = {
  ret?: number;
  msg?: string;
  data?: { ID?: string; };
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/folders/list.html */
export type GetFolderListRequest = {
  sortType?: string;
  asc?: number;
  start?: number;
  limit?: number;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/folders/list.html */
export type GetFolderListResponse = {
  ret?: number;
  msg?: string;
  data?: TencentDocsJsonObject;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/folders/metadata.html */
export type GetFolderMetadataResponse = {
  ret?: number;
  msg?: string;
  data?: { folderInfo?: TencentDocsJsonObject; };
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/folders/move.html */
export type MoveFolderRequest = {
  parentfolderID: string;
  targetfolderID: string;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/folders/get_permission.html */
export type GetFolderPermissionResponse = {
  ret?: number;
  msg?: string;
  data?: TencentDocsJsonObject;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/form/publish.html */
export type UpdateFormReleaseTimeRequest = {
  endTime?: number;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/form/result.html */
export type GenerateFormResultResponse = {
  ret?: number;
  msg?: string;
  data?: TencentDocsFileInfo;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/groups/create.html */
export type CreateGroupRequest = {
  groupInfo?: string;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/groups/create.html */
export type CreateGroupResponse = {
  ret?: number;
  msg?: string;
  data?: { groupID?: number; };
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/groups/get.html */
export type GetGroupInfoResponse = {
  ret?: number;
  msg?: string;
  data?: { groupInfo?: string; };
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/notification/unread_count.html */
export type GetNotificationUnreadCountResponse = {
  ret?: number;
  msg?: string;
  data?: { count?: number; };
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/search/search.html */
export type SearchDocumentsRequest = {
  searchKey: string;
  searchType: string;
  resultType?: string;
  folderID?: string;
  offset?: number;
  size?: number;
  sortType?: string;
  asc?: number;
  byOwnership?: number;
  fileTypes?: string;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/search/search.html */
export type SearchDocumentsResponse = {
  ret?: number;
  msg?: string;
  data?: TencentDocsJsonObject;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/util/converter.html */
export type ConvertFileIdRequest = {
  type: number;
  value: string;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/util/converter.html */
export type ConvertFileIdResponse = {
  ret?: number;
  msg?: string;
  data?: { encodedID?: string; fileID?: string; };
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/util/get_resource_use.html */
export type GetAppResourceUsageResponse = {
  ret?: number;
  msg?: string;
  data?: TencentDocsJsonObject;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/util/temp_url.html */
export type GetTempUrlRequest = {
  type: string;
  fileID?: string;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/file/util/temp_url.html */
export type GetTempUrlResponse = {
  ret?: number;
  msg?: string;
  data?: { tempURL?: string; };
};

/** @see https://docs.qq.com/open/document/app/openapi/v3/subscription/create.html */
export type CreateSubscriptionRequest = {
  address: string;
  event_type?: string;
  resource_id?: string;
  expiration?: number;
};

/** @see https://docs.qq.com/open/document/app/openapi/v3/subscription/create.html */
export type CreateSubscriptionResponse = {
  subscription?: TencentDocsJsonObject;
};

/** @see https://docs.qq.com/open/document/app/openapi/v3/subscription/update.html */
export type UpdateSubscriptionEventRequest = {
  expiration?: number;
  address: string;
};

/** @see https://docs.qq.com/open/document/app/openapi/v3/subscription/update.html */
export type UpdateSubscriptionEventResponse = {
  subscription?: TencentDocsJsonObject;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/sheet/sheetbook/delete_dimension.html */
export type BatchUpdateSheetBookRequest = {
  deleteDimension: TencentDocsJsonObject;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/sheet/sheetbook/get_sheet.html */
export type GetSheetListResponse = {
  ret?: number;
  msg?: string;
  data?: TencentDocsJsonObject;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/sheet/values/get_in.html */
export type GetSheetValuesResponse = {
  ret?: number;
  msg?: string;
  data?: { range?: string; values?: string[][]; };
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/smartsheet/sheet/delete_sheet.html */
export type DeleteSheetRequest = {
  deleteSheet: TencentDocsJsonObject;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/smartsheet/field/get_fields.html */
export type GetSmartsheetFieldsRequest = {
  getFields: TencentDocsJsonObject;
};

/** @see https://docs.qq.com/open/document/app/openapi/v2/smartsheet/field/get_fields.html */
export type GetSmartsheetFieldsResponse = {
  ret?: number;
  msg?: string;
  data?: { getFields?: TencentDocsJsonObject; };
};

/** @see https://docs.qq.com/open/document/app/openapi/v3/sheet/get/get_range.html */
export type GetSpreadsheetRangeDataResponse = {
  code?: number;
  message?: string;
  gridData?: TencentDocsJsonObject;
};

/** @see https://docs.qq.com/open/document/app/openapi/v3/sheet/batchupdate/update.html */
export type BatchUpdateSpreadsheetRequest = {
  requests: unknown[];
};

/** @see https://docs.qq.com/open/document/app/openapi/v3/sheet/batchupdate/update.html */
export type BatchUpdateSpreadsheetResponse = {
  code?: number;
  message?: string;
  data?: { responses?: unknown[]; };
};

/** @see https://docs.qq.com/open/document/app/openapi/v1/file/files/create.html */
export type CreateDocRequest = {
  title: string;
  doc_type: number;
  template_id?: number;
  folder_id?: string;
};

/** @see https://docs.qq.com/open/document/app/openapi/v1/file/files/create.html */
export type CreateDocResponse = TencentDocsEmptyObject;
