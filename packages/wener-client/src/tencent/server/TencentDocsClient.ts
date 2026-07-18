import { Errors, type FetchLike } from '@wener/utils';
import {
	createExpireValueHolder,
	type ExpireValueHolderInit,
	type ExpiryValue,
	type ExpiryValueHolder,
} from '../../ExpiryValue';
import { type RequestOptions, request } from './request';
import type * as S from './schema';
import type { TencentDocsGeneralResponse } from './types';

export interface TencentDocsClientInit {
	clientId: string;
	clientSecret: string;
	accessToken?: ExpireValueHolderInit;
	onAccessToken?: (data: ExpiryValue) => void;
	openId?: string;
	fetch?: FetchLike;
	debug?: boolean;
}

export interface TencentDocsClientOptions {
	clientId: string;
	clientSecret: string;
	accessToken: ExpiryValueHolder;
	openId?: string;
	debug: boolean;
}

export class TencentDocsClient {
	static create({ clientId, clientSecret, accessToken, onAccessToken, ...init }: TencentDocsClientInit) {
		return new TencentDocsClient({
			debug: false,
			accessToken: createExpireValueHolder({
				value: accessToken,
				onLoad: onAccessToken,
				loader: async () => {
					// OAuth2 client_credentials grant
					const res = await request<{
						access_token: string;
						expires_in: number;
					}>({
						url: '/oauth/v2/token',
						params: {
							client_id: clientId,
							client_secret: clientSecret,
							grant_type: 'client_credentials',
						},
					});
					return {
						value: res.access_token,
						expiresAt: new Date(Date.now() + res.expires_in * 1000),
					};
				},
			}),
			clientId,
			clientSecret,
			...init,
		});
	}

	constructor(readonly options: TencentDocsClientOptions) {}

	with(o: Partial<TencentDocsClientOptions>) {
		return new TencentDocsClient({ ...this.options, ...o });
	}

	async getAccessToken() {
		return this.options.accessToken.get();
	}

	// region generated-apis
	// Code generated from Tencent Docs API documentation. DO NOT EDIT.
	// prettier-ignore-start
	/**
	 * 获取 Authorization Code（插件快速授权）
	 * @see https://docs.qq.com/open/document/app/oauth2/addon_authorize_in.html
	 */
	async getAddonAuthorize(params: S.GetAddonAuthorizeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetAddonAuthorizeResponse>({ url: '/oauth/v2/addon/authorize', params, ...opts });
	}
	/**
	 * 获取应用级账号 Token
	 * @see https://docs.qq.com/open/document/app/oauth2/app_account_token.html
	 */
	async getAppAccountToken(params: S.GetAppAccountTokenRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetAppAccountTokenResponse>({ url: '/oauth/v2/app-account-token', params, ...opts });
	}
	/**
	 * 发起授权
	 * @see https://docs.qq.com/open/document/app/oauth2/authorize.html
	 */
	async authorize(params: S.AuthorizeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.AuthorizeResponse>({ url: '/oauth/v2/authorize', params, ...opts });
	}
	/**
	 * 获取 Authorization Code（Drive 官方插件快速授权）
	 * @see https://docs.qq.com/open/document/app/oauth2/direct_authorize_in.html
	 */
	async getAuthorizationCode(params: S.GetAuthorizationCodeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetAuthorizationCodeResponse>({ url: '/oauth/v2/direct/authorize', params, ...opts });
	}
	/**
	 * 获取 Authorization Code（内部快速授权）
	 * @see https://docs.qq.com/open/document/app/oauth2/authorize_in.html
	 */
	async getInnerAuthorizeCode(
		platform: string,
		params: S.GetInnerAuthorizeCodeRequest,
		opts?: Partial<RequestOptions<any>>,
	) {
		return this.request<S.GetInnerAuthorizeCodeResponse>({
			url: `/oauth/v2/inner/${platform}/authorize`,
			params,
			...opts,
		});
	}
	/**
	 * 获取该用户是否有二次登录密码
	 * @see https://docs.qq.com/open/document/app/oauth2/has_pwd_in.html
	 */
	async getUserHasSecondPassword(opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetUserHasSecondPasswordResponse>({ url: '/oauth/v2/inner/has-pwd', ...opts });
	}
	/**
	 * 校验用户二次登录密码
	 * @see https://docs.qq.com/open/document/app/oauth2/verify_pwd_in.html
	 */
	async verifyUserPassword(params: S.VerifyUserPasswordRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<TencentDocsGeneralResponse>({ url: '/oauth/v2/inner/verify-pwd', params, ...opts });
	}
	/**
	 * 获取文档文本内容
	 * @see https://docs.qq.com/open/document/private/openapi/file/get_content.html
	 */
	async getFileContent(file_id: string, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetFileContentResponse>({ url: `/openapi/content/v1/files/${file_id}/getcontent`, ...opts });
	}
	/**
	 * 获取企微 Doc 文档内容
	 * @see https://docs.qq.com/open/document/app/openapi/v3/doc/get/get_in.html
	 */
	async getWecomDocContent(fileId: string, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetWecomDocContentResponse>({ url: `/openapi/doc/v3/${fileId}`, ...opts });
	}
	/**
	 * 更新 Doc 文档内容
	 * @see https://docs.qq.com/open/document/app/openapi/v3/doc/batchupdate/update.html
	 */
	async batchUpdateDocContent(
		fileId: string,
		body: S.BatchUpdateDocContentRequest,
		opts?: Partial<RequestOptions<any>>,
	) {
		return this.request<TencentDocsGeneralResponse>({
			method: 'POST',
			url: `/openapi/doc/v3/${fileId}:batchUpdate`,
			body,
			...opts,
		});
	}
	/**
	 * 获取 Doc 文档内容
	 * @see https://docs.qq.com/open/document/private/openapi/doc/get/get.html
	 */
	async getDocFileContent(fileId: string, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetDocFileContentResponse>({ url: `/openapi/doc/v3/files/${fileId}`, ...opts });
	}
	/**
	 * 确认drive插件文档缩略图上传完成
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/thumbnail/get_thumbnail_result.html
	 */
	async confirmDriveAddonThumbnailUpload(
		fileID: string,
		params: S.ConfirmDriveAddonThumbnailUploadRequest,
		opts?: Partial<RequestOptions<any>>,
	) {
		return this.request<TencentDocsGeneralResponse>({
			url: `/openapi/drive-addon/v2/files/${fileID}/thumbnail`,
			params,
			...opts,
		});
	}
	/**
	 * 新建文档
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/files/create.html
	 */
	async createFileFiles(body: S.CreateFileFilesRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.CreateFileFilesResponse>({ method: 'POST', url: '/openapi/drive/v2/files', body, ...opts });
	}
	/**
	 * 删除文档
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/files/delete.html
	 */
	async deleteFileFiles(fileID: string, body: S.DeleteFileFilesRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<TencentDocsGeneralResponse>({
			method: 'DELETE',
			url: `/openapi/drive/v2/files/${fileID}`,
			body,
			...opts,
		});
	}
	/**
	 * 查询用户访问权限
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/files/access.html
	 */
	async getFileAccess(fileID: string, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetFileAccessResponse>({ url: `/openapi/drive/v2/files/${fileID}/access`, ...opts });
	}
	/**
	 * 导出文档
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/export/async_export.html
	 */
	async asyncExportFile(fileID: string, body: S.AsyncExportFileRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.AsyncExportFileResponse>({
			method: 'POST',
			url: `/openapi/drive/v2/files/${fileID}/async-export`,
			body,
			...opts,
		});
	}
	/**
	 * 获取克隆票据
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/files/clone/clone_key.html
	 */
	async getFileCloneKey(fileID: string, body: S.GetFileCloneKeyRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetFileCloneKeyResponse>({
			method: 'POST',
			url: `/openapi/drive/v2/files/${fileID}/clone-key`,
			body,
			...opts,
		});
	}
	/**
	 * 移除协作成员
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/files/collaborators/delete.html
	 */
	async deleteCollaborator(fileID: string, body: S.DeleteCollaboratorRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<TencentDocsGeneralResponse>({
			method: 'DELETE',
			url: `/openapi/drive/v2/files/${fileID}/collaborators`,
			body,
			...opts,
		});
	}
	/**
	 * 生成副本
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/files/copy.html
	 */
	async createFileCopy(fileID: string, body: S.CreateFileCopyRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.CreateFileCopyResponse>({
			method: 'POST',
			url: `/openapi/drive/v2/files/${fileID}/copy`,
			body,
			...opts,
		});
	}
	/**
	 * 导出文档
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/export/export_in.html
	 */
	async exportFileExport(fileID: string, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.ExportFileExportResponse>({ url: `/openapi/drive/v2/files/${fileID}/export`, ...opts });
	}
	/**
	 * 导出进度查询
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/export/export_progress.html
	 */
	async getExportProgress(fileID: string, params: S.GetExportProgressRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetExportProgressResponse>({
			url: `/openapi/drive/v2/files/${fileID}/export-progress`,
			params,
			...opts,
		});
	}
	/**
	 * 获取协作成员
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/files/members/get_in.html
	 */
	async getFileMembers(fileid: string, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetFileMembersResponse>({ url: `/openapi/drive/v2/files/${fileid}/members`, ...opts });
	}
	/**
	 * 删除协作成员
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/files/members/delete_in.html
	 */
	async deleteFileMembers(fileID: string, body: S.DeleteFileMembersRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<TencentDocsGeneralResponse>({
			method: 'DELETE',
			url: `/openapi/drive/v2/files/${fileID}/members`,
			body,
			...opts,
		});
	}
	/**
	 * 查询文档
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/files/metadata.html
	 */
	async getFileMetadata(fileID: string, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetFileMetadataResponse>({ url: `/openapi/drive/v2/files/${fileID}/metadata`, ...opts });
	}
	/**
	 * 移动文档
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/files/move.html
	 */
	async moveFile(fileID: string, body: S.MoveFileRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<TencentDocsGeneralResponse>({
			method: 'PATCH',
			url: `/openapi/drive/v2/files/${fileID}/move`,
			body,
			...opts,
		});
	}
	/**
	 * 转让文档所有权
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/files/ownership.html
	 */
	async transferFileOwnership(
		fileID: string,
		body: S.TransferFileOwnershipRequest,
		opts?: Partial<RequestOptions<any>>,
	) {
		return this.request<TencentDocsGeneralResponse>({
			method: 'PATCH',
			url: `/openapi/drive/v2/files/${fileID}/ownership`,
			body,
			...opts,
		});
	}
	/**
	 * 查看文档权限
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/files/permission/get.html
	 */
	async getFilePermission(fileID: string, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetFilePermissionResponse>({ url: `/openapi/drive/v2/files/${fileID}/permission`, ...opts });
	}
	/**
	 * 申请文档权限
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/files/permission/apply.html
	 */
	async applyFilePermission(fileID: string, body: S.ApplyFilePermissionRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<TencentDocsGeneralResponse>({
			method: 'POST',
			url: `/openapi/drive/v2/files/${fileID}/permission/apply`,
			body,
			...opts,
		});
	}
	/**
	 * 置顶文档
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/files/pin.html
	 */
	async pinFile(fileID: string, body: S.PinFileRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<TencentDocsGeneralResponse>({
			method: 'PATCH',
			url: `/openapi/drive/v2/files/${fileID}/pin`,
			body,
			...opts,
		});
	}
	/**
	 * 创建演示房间
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/files/presentation/create_in.html
	 */
	async createPresentationRoom(
		fileID: string,
		body: S.CreatePresentationRoomRequest,
		opts?: Partial<RequestOptions<any>>,
	) {
		return this.request<S.CreatePresentationRoomResponse>({
			method: 'POST',
			url: `/openapi/drive/v2/files/${fileID}/presentation`,
			body,
			...opts,
		});
	}
	/**
	 * 恢复文档
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/files/recover.html
	 */
	async recoverFile(fileID: string, body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<TencentDocsGeneralResponse>({
			method: 'PATCH',
			url: `/openapi/drive/v2/files/${fileID}/recover`,
			body,
			...opts,
		});
	}
	/**
	 * 创建快捷方式
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/files/shortcut.html
	 */
	async createShortcut(fileID: string, body: S.CreateShortcutRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<TencentDocsGeneralResponse>({
			method: 'POST',
			url: `/openapi/drive/v2/files/${fileID}/shortcut`,
			body,
			...opts,
		});
	}
	/**
	 * 收藏文档
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/files/star.html
	 */
	async starFile(fileID: string, body: S.StarFileRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<TencentDocsGeneralResponse>({
			method: 'PATCH',
			url: `/openapi/drive/v2/files/${fileID}/star`,
			body,
			...opts,
		});
	}
	/**
	 * 设置水印
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/files/watermark/set.html
	 */
	async setWatermark(fileID: string, body: S.SetWatermarkRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<TencentDocsGeneralResponse>({
			method: 'PATCH',
			url: `/openapi/drive/v2/files/${fileID}/watermark`,
			body,
			...opts,
		});
	}
	/**
	 * 获取文档发布网页链接
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/files/webpublish/get.html
	 */
	async getFileWebPublish(fileID: string, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetFileWebPublishResponse>({ url: `/openapi/drive/v2/files/${fileID}/web-publish`, ...opts });
	}
	/**
	 * 异步导入文档
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/import/async_import.html
	 */
	async asyncImportFile(body: S.AsyncImportFileRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.AsyncImportFileResponse>({
			method: 'POST',
			url: '/openapi/drive/v2/files/async-import',
			body,
			...opts,
		});
	}
	/**
	 * 克隆文档
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/files/clone/clone.html
	 */
	async cloneFile(body: S.CloneFileRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.CloneFileResponse>({ method: 'POST', url: '/openapi/drive/v2/files/clone', body, ...opts });
	}
	/**
	 * 完成文件导入
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/import/import_in.html
	 */
	async importFileImport(body: S.ImportFileImportRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.ImportFileImportResponse>({
			method: 'POST',
			url: '/openapi/drive/v2/files/import',
			body,
			...opts,
		});
	}
	/**
	 * 查询导入进度
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/import/import_progress.html
	 */
	async getImportProgress(params: S.GetImportProgressRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetImportProgressResponse>({
			url: '/openapi/drive/v2/files/import-progress',
			params,
			...opts,
		});
	}
	/**
	 * 预导入文档
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/import/cos_sdk_pre_import_in.html
	 */
	async preImportFile(body: S.PreImportFileRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.PreImportFileResponse>({
			method: 'POST',
			url: '/openapi/drive/v2/files/pre-import',
			body,
			...opts,
		});
	}
	/**
	 * 删除演示房间
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/files/presentation/delete_in.html
	 */
	async deletePresentationRoom(roomID: string, body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<TencentDocsGeneralResponse>({
			method: 'DELETE',
			url: `/openapi/drive/v2/files/presentation/${roomID}`,
			body,
			...opts,
		});
	}
	/**
	 * 预导入文档
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/import/pre_import.html
	 */
	async createFileUploadInfo(body: S.CreateFileUploadInfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.CreateFileUploadInfoResponse>({
			method: 'POST',
			url: '/openapi/drive/v2/files/upload',
			body,
			...opts,
		});
	}
	/**
	 * 列表过滤
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/filter/filter.html
	 */
	async getFilter(params: S.GetFilterRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetFilterResponse>({ url: '/openapi/drive/v2/filter', params, ...opts });
	}
	/**
	 * 添加文件夹
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/folders/add.html
	 */
	async createFolder(body: S.CreateFolderRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.CreateFolderResponse>({ method: 'POST', url: '/openapi/drive/v2/folders', body, ...opts });
	}
	/**
	 * 获取文档列表
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/folders/list.html
	 */
	async getFolderList(folderID: string, params: S.GetFolderListRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetFolderListResponse>({ url: `/openapi/drive/v2/folders/${folderID}`, params, ...opts });
	}
	/**
	 * 查询文件夹信息
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/folders/metadata.html
	 */
	async getFolderMetadata(folderID: string, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetFolderMetadataResponse>({
			url: `/openapi/drive/v2/folders/${folderID}/metadata`,
			...opts,
		});
	}
	/**
	 * 移动文件夹
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/folders/move.html
	 */
	async moveFolder(folderID: string, body: S.MoveFolderRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<TencentDocsGeneralResponse>({
			method: 'POST',
			url: `/openapi/drive/v2/folders/${folderID}/move`,
			body,
			...opts,
		});
	}
	/**
	 * 查询文件夹权限
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/folders/get_permission.html
	 */
	async getFolderPermission(folderID: string, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetFolderPermissionResponse>({
			url: `/openapi/drive/v2/folders/${folderID}/permission`,
			...opts,
		});
	}
	/**
	 * 更新收集截止时间
	 * @see https://docs.qq.com/open/document/app/openapi/v2/form/publish.html
	 */
	async updateFormReleaseTime(
		formID: string,
		body: S.UpdateFormReleaseTimeRequest,
		opts?: Partial<RequestOptions<any>>,
	) {
		return this.request<TencentDocsGeneralResponse>({
			method: 'PUT',
			url: `/openapi/drive/v2/forms/${formID}/release`,
			body,
			...opts,
		});
	}
	/**
	 * 生成收集结果
	 * @see https://docs.qq.com/open/document/app/openapi/v2/form/result.html
	 */
	async generateFormResult(formID: string, body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GenerateFormResultResponse>({
			method: 'POST',
			url: `/openapi/drive/v2/forms/${formID}/result`,
			body,
			...opts,
		});
	}
	/**
	 * 新建权限组
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/groups/create.html
	 */
	async createGroup(body: S.CreateGroupRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.CreateGroupResponse>({ method: 'POST', url: '/openapi/drive/v2/groups', body, ...opts });
	}
	/**
	 * 获取权限组信息
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/groups/get.html
	 */
	async getGroupInfo(groupID: string, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetGroupInfoResponse>({ url: `/openapi/drive/v2/groups/${groupID}`, ...opts });
	}
	/**
	 * 查询消息列表未读数量
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/notification/unread_count.html
	 */
	async getNotificationUnreadCount(opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetNotificationUnreadCountResponse>({
			url: '/openapi/drive/v2/notification/unread-count',
			...opts,
		});
	}
	/**
	 * 关键字搜索
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/search/search.html
	 */
	async searchDocuments(params: S.SearchDocumentsRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.SearchDocumentsResponse>({ url: '/openapi/drive/v2/search', params, ...opts });
	}
	/**
	 * fileID 转换
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/util/converter.html
	 */
	async convertFileId(params: S.ConvertFileIdRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.ConvertFileIdResponse>({ url: '/openapi/drive/v2/util/converter', params, ...opts });
	}
	/**
	 * 获取应用OpenAPI使用详情
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/util/get_resource_use.html
	 */
	async getAppResourceUsage(opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetAppResourceUsageResponse>({ url: '/openapi/drive/v2/util/resource-use', ...opts });
	}
	/**
	 * 获取临时链接
	 * @see https://docs.qq.com/open/document/app/openapi/v2/file/util/temp_url.html
	 */
	async getTempUrl(body: S.GetTempUrlRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetTempUrlResponse>({
			method: 'POST',
			url: '/openapi/drive/v2/util/temp-url',
			body,
			...opts,
		});
	}
	/**
	 * 上传附件
	 * @see https://docs.qq.com/open/document/private/openapi/file/upload_attachment.html
	 */
	async uploadAttachment(body: S.UploadAttachmentRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.UploadAttachmentResponse>({
			method: 'POST',
			url: '/openapi/drive/v3/attachment:upload',
			body,
			...opts,
		});
	}
	/**
	 * 修改容量配置
	 * @see https://docs.qq.com/open/document/private/openapi/admin/update_capacity_config.html
	 */
	async updateCapacityConfig(body: S.UpdateCapacityConfigRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.UpdateCapacityConfigResponse>({
			method: 'POST',
			url: '/openapi/drive/v3/capacity/config_update',
			body,
			...opts,
		});
	}
	/**
	 * 查询容量详情
	 * @see https://docs.qq.com/open/document/private/openapi/admin/get_capacity.html
	 */
	async getCapacityInfo(body: S.GetCapacityInfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetCapacityInfoResponse>({
			method: 'POST',
			url: '/openapi/drive/v3/capacity/info',
			body,
			...opts,
		});
	}
	/**
	 * 修改用户使用容量限制
	 * @see https://docs.qq.com/open/document/private/openapi/admin/update_user_capacity_limit.html
	 */
	async updateUserCapacityLimit(body: S.UpdateUserCapacityLimitRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<TencentDocsGeneralResponse>({
			method: 'POST',
			url: '/openapi/drive/v3/capacity/userCapacity_update',
			body,
			...opts,
		});
	}
	/**
	 * 获取密级标签/策略的命中文档列表
	 * @see https://docs.qq.com/open/document/private/openapi/admin/get_hit_docs.html
	 */
	async getConfidentialHitDocs(body: S.GetConfidentialHitDocsRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetConfidentialHitDocsResponse>({
			method: 'POST',
			url: '/openapi/drive/v3/confidential/hit-docs',
			body,
			...opts,
		});
	}
	/**
	 * 查询密级标签策略列表
	 * @see https://docs.qq.com/open/document/private/openapi/admin/get_rules.html
	 */
	async getConfidentialRules(params: S.GetConfidentialRulesRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetConfidentialRulesResponse>({
			url: '/openapi/drive/v3/confidential/rules',
			params,
			...opts,
		});
	}
	/**
	 * 查询密级标签策略详情
	 * @see https://docs.qq.com/open/document/private/openapi/admin/get_rule.html
	 */
	async getConfidentialRuleDetail(ruleId: string, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetConfidentialRuleDetailResponse>({
			url: `/openapi/drive/v3/confidential/rules/${ruleId}`,
			...opts,
		});
	}
	/**
	 * 查询密级标签设置列表
	 * @see https://docs.qq.com/open/document/private/openapi/admin/get_tags.html
	 */
	async getConfidentialTagsList(params: S.GetConfidentialTagsListRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetConfidentialTagsListResponse>({
			url: '/openapi/drive/v3/confidential/tags',
			params,
			...opts,
		});
	}
	/**
	 * 查询密级标签设置详情
	 * @see https://docs.qq.com/open/document/private/openapi/admin/get_tag.html
	 */
	async getConfidentialTagDetail(tagId: string, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetConfidentialTagDetailResponse>({
			url: `/openapi/drive/v3/confidential/tags/${tagId}`,
			...opts,
		});
	}
	/**
	 * 新建文件
	 * @see https://docs.qq.com/open/document/saas/openapi/file/create.html
	 */
	async createFile(body: S.CreateFileRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.CreateFileResponse>({ method: 'POST', url: '/openapi/drive/v3/files', body, ...opts });
	}
	/**
	 * 导入文档
	 * @see https://docs.qq.com/open/document/private/openapi/file/import.html
	 */
	async importFile(body: S.ImportFileRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.ImportFileResponse>({ method: 'POST', url: '/openapi/drive/v3/files:import', body, ...opts });
	}
	/**
	 * 拉取文件列表
	 * @see https://docs.qq.com/open/document/saas/openapi/file/list.html
	 */
	async listFiles(body: S.ListFilesRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.ListFilesResponse>({ method: 'POST', url: '/openapi/drive/v3/files:list', body, ...opts });
	}
	/**
	 * 搜索文件
	 * @see https://docs.qq.com/open/document/private/openapi/file/search.html
	 */
	async searchFiles(body: S.SearchFilesRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.SearchFilesResponse>({
			method: 'POST',
			url: '/openapi/drive/v3/files:search',
			body,
			...opts,
		});
	}
	/**
	 * 上传文件
	 * @see https://docs.qq.com/open/document/saas/openapi/file/upload.html
	 */
	async uploadFile(body: S.UploadFileRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.UploadFileResponse>({ method: 'POST', url: '/openapi/drive/v3/files:upload', body, ...opts });
	}
	/**
	 * 在线DOC转本地PDF
	 * @see https://docs.qq.com/open/document/private/openapi/file/doc_convert_pdf.html
	 */
	async convertAndExportPDF(file_id: string, body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.ConvertAndExportPDFResponse>({
			method: 'POST',
			url: `/openapi/drive/v3/files/${file_id}:convertAndExportPDF`,
			body,
			...opts,
		});
	}
	/**
	 * 转让审批
	 * @see https://docs.qq.com/open/document/private/openapi/file/transowner_approve.html
	 */
	async approveFileTransfer(file_id: string, body: S.ApproveFileTransferRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<TencentDocsGeneralResponse>({
			method: 'POST',
			url: `/openapi/drive/v3/files/${file_id}/transOwner:approve`,
			body,
			...opts,
		});
	}
	/**
	 * 删除文件
	 * @see https://docs.qq.com/open/document/saas/openapi/file/delete.html
	 */
	async deleteFile(fileId: string, body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.DeleteFileResponse>({
			method: 'DELETE',
			url: `/openapi/drive/v3/files/${fileId}`,
			body,
			...opts,
		});
	}
	/**
	 * 生成文件副本
	 * @see https://docs.qq.com/open/document/saas/openapi/file/copy.html
	 */
	async copyFile(fileId: string, body: S.CopyFileRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.CopyFileResponse>({
			method: 'POST',
			url: `/openapi/drive/v3/files/${fileId}:copy`,
			body,
			...opts,
		});
	}
	/**
	 * 下载文件
	 * @see https://docs.qq.com/open/document/saas/openapi/file/download.html
	 */
	async downloadFile(fileId: string, body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.DownloadFileResponse>({
			method: 'POST',
			url: `/openapi/drive/v3/files/${fileId}:download`,
			body,
			...opts,
		});
	}
	/**
	 * 导出文档
	 * @see https://docs.qq.com/open/document/private/openapi/file/export.html
	 */
	async exportFile(fileId: string, body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.ExportFileResponse>({
			method: 'POST',
			url: `/openapi/drive/v3/files/${fileId}:export`,
			body,
			...opts,
		});
	}
	/**
	 * 移动文件
	 * @see https://docs.qq.com/open/document/saas/openapi/file/move.html
	 */
	async moveFileFiles(fileId: string, body: S.MoveFileFilesRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.MoveFileFilesResponse>({
			method: 'POST',
			url: `/openapi/drive/v3/files/${fileId}:move`,
			body,
			...opts,
		});
	}
	/**
	 * 恢复文件
	 * @see https://docs.qq.com/open/document/private/openapi/file/recover.html
	 */
	async recoverFileFiles(fileId: string, body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.RecoverFileFilesResponse>({
			method: 'POST',
			url: `/openapi/drive/v3/files/${fileId}:recover`,
			body,
			...opts,
		});
	}
	/**
	 * 获取文件权限
	 * @see https://docs.qq.com/open/document/saas/openapi/permission/get.html
	 */
	async getFilePermissions(fileId: string, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetFilePermissionsResponse>({
			url: `/openapi/drive/v3/files/${fileId}/permissions`,
			...opts,
		});
	}
	/**
	 * 查询用户访问权限
	 * @see https://docs.qq.com/open/document/saas/openapi/permission/access.html
	 */
	async getFileAccessPermission(
		fileId: string,
		params: S.GetFileAccessPermissionRequest,
		opts?: Partial<RequestOptions<any>>,
	) {
		return this.request<S.GetFileAccessPermissionResponse>({
			url: `/openapi/drive/v3/files/${fileId}/permissions:access`,
			params,
			...opts,
		});
	}
	/**
	 * 权限审批
	 * @see https://docs.qq.com/open/document/private/openapi/permission/approve.html
	 */
	async approveFilePermission(
		fileId: string,
		body: S.ApproveFilePermissionRequest,
		opts?: Partial<RequestOptions<any>>,
	) {
		return this.request<TencentDocsGeneralResponse>({
			method: 'POST',
			url: `/openapi/drive/v3/files/${fileId}/permissions:approve`,
			body,
			...opts,
		});
	}
	/**
	 * 上传图片
	 * @see https://docs.qq.com/open/document/private/openapi/file/uploadPic.html
	 */
	async uploadImage(body: S.UploadImageRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.UploadImageResponse>({
			method: 'POST',
			url: '/openapi/drive/v3/image:upload',
			body,
			...opts,
		});
	}
	/**
	 * 恢复离职成员
	 * @see https://docs.qq.com/open/document/private/openapi/admin/recoverResignedEmployee.html
	 */
	async recoverResignedEmployee(body: S.RecoverResignedEmployeeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.RecoverResignedEmployeeResponse>({
			method: 'POST',
			url: '/openapi/drive/v3/recoverResignedEmployee',
			body,
			...opts,
		});
	}
	/**
	 * 查询共享空间限制空间人数配置
	 * @see https://docs.qq.com/open/document/private/openapi/admin/get_sharespace_limit_config.html
	 */
	async getShareSpaceLimitConfig(opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetShareSpaceLimitConfigResponse>({
			url: '/openapi/drive/v3/shareSpace/limitConfig_query',
			...opts,
		});
	}
	/**
	 * 修改共享空间限制空间人数配置
	 * @see https://docs.qq.com/open/document/private/openapi/admin/update_sharespace_limit_config.html
	 */
	async updateShareSpaceLimitConfig(body: S.UpdateShareSpaceLimitConfigRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<TencentDocsGeneralResponse>({
			method: 'POST',
			url: '/openapi/drive/v3/shareSpace/limitConfig_update',
			body,
			...opts,
		});
	}
	/**
	 * 查询任务进度
	 * @see https://docs.qq.com/open/document/private/openapi/file/task.html
	 */
	async getTaskProgress(taskId: string, params: S.GetTaskProgressRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetTaskProgressResponse>({ url: `/openapi/drive/v3/tasks/${taskId}`, params, ...opts });
	}
	/**
	 * 取消任务
	 * @see https://docs.qq.com/open/document/private/openapi/file/cancelTask.html
	 */
	async cancelTask(taskId: string, body: S.CancelTaskRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<TencentDocsGeneralResponse>({
			method: 'POST',
			url: `/openapi/drive/v3/tasks/${taskId}:cancel`,
			body,
			...opts,
		});
	}
	/**
	 * Tencent Docs MCP API
	 * @see https://docs.qq.com/open/document/mcp/tool-introduce/
	 */
	async postMcpToolCall(body: S.PostMcpToolCallRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.PostMcpToolCallResponse>({ method: 'POST', url: '/openapi/mcp', body, ...opts });
	}
	/**
	 * 订阅事件
	 * @see https://docs.qq.com/open/document/app/openapi/v3/subscription/create.html
	 */
	async createSubscription(body: S.CreateSubscriptionRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.CreateSubscriptionResponse>({
			method: 'POST',
			url: '/openapi/notification/v3/subscriptions',
			body,
			...opts,
		});
	}
	/**
	 * 更新订阅事件
	 * @see https://docs.qq.com/open/document/app/openapi/v3/subscription/update.html
	 */
	async updateSubscriptionEvent(
		subscribe_id: string,
		body: S.UpdateSubscriptionEventRequest,
		opts?: Partial<RequestOptions<any>>,
	) {
		return this.request<S.UpdateSubscriptionEventResponse>({
			method: 'POST',
			url: `/openapi/notification/v3/subscriptions/${subscribe_id}:update`,
			body,
			...opts,
		});
	}
	/**
	 * 删除多行（列）
	 * @see https://docs.qq.com/open/document/app/openapi/v2/sheet/sheetbook/delete_dimension.html
	 */
	async batchUpdateSheetBook(bookID: string, body: S.BatchUpdateSheetBookRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<TencentDocsGeneralResponse>({
			method: 'POST',
			url: `/openapi/sheetbook/v2/${bookID}:batchUpdate`,
			body,
			...opts,
		});
	}
	/**
	 * 查询子表
	 * @see https://docs.qq.com/open/document/app/openapi/v2/sheet/sheetbook/get_sheet.html
	 */
	async getSheetList(bookID: string, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetSheetListResponse>({ url: `/openapi/sheetbook/v2/${bookID}/sheets-info`, ...opts });
	}
	/**
	 * 获取区域内容
	 * @see https://docs.qq.com/open/document/app/openapi/v2/sheet/values/get_in.html
	 */
	async getSheetValues(bookID: string, range: string, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetSheetValuesResponse>({ url: `/openapi/sheetbook/v2/${bookID}/values/${range}`, ...opts });
	}
	/**
	 * 清空区域内容
	 * @see https://docs.qq.com/open/document/app/openapi/v2/sheet/values/clear.html
	 */
	async clearSheetRange(
		bookID: string,
		range: string,
		body?: Record<string, any>,
		opts?: Partial<RequestOptions<any>>,
	) {
		return this.request<TencentDocsGeneralResponse>({
			method: 'POST',
			url: `/openapi/sheetbook/v2/${bookID}/values/${range}:clear`,
			body,
			...opts,
		});
	}
	/**
	 * 删除子表
	 * @see https://docs.qq.com/open/document/app/openapi/v2/smartsheet/sheet/delete_sheet.html
	 */
	async deleteSheet(fileID: string, body: S.DeleteSheetRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<TencentDocsGeneralResponse>({
			method: 'POST',
			url: `/openapi/smartbook/v2/files/${fileID}/sheets`,
			body,
			...opts,
		});
	}
	/**
	 * 查询字段
	 * @see https://docs.qq.com/open/document/app/openapi/v2/smartsheet/field/get_fields.html
	 */
	async getSmartsheetFields(
		fileID: string,
		sheetID: string,
		body: S.GetSmartsheetFieldsRequest,
		opts?: Partial<RequestOptions<any>>,
	) {
		return this.request<S.GetSmartsheetFieldsResponse>({
			method: 'POST',
			url: `/openapi/smartbook/v2/files/${fileID}/sheets/${sheetID}`,
			body,
			...opts,
		});
	}
	/**
	 * 删除元素
	 * @see https://docs.qq.com/open/document/private/openapi/smartcanvas/delete_element.html
	 */
	async deleteElement(file_id: string, body: S.DeleteElementRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<TencentDocsGeneralResponse>({
			method: 'DELETE',
			url: `/openapi/smartcanvas/v2/files/${file_id}/element`,
			body,
			...opts,
		});
	}
	/**
	 * 查询元素信息
	 * @see https://docs.qq.com/open/document/private/openapi/smartcanvas/get_element_info.html
	 */
	async queryElementInfo(file_id: string, body: S.QueryElementInfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.QueryElementInfoResponse>({
			method: 'POST',
			url: `/openapi/smartcanvas/v2/files/${file_id}/elementInfo`,
			body,
			...opts,
		});
	}
	/**
	 * 查询页面文档内容
	 * @see https://docs.qq.com/open/document/private/openapi/smartcanvas/get_page_info.html
	 */
	async getPageInfo(file_id: string, body: S.GetPageInfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetPageInfoResponse>({
			method: 'POST',
			url: `/openapi/smartcanvas/v2/files/${file_id}/pageInfo`,
			body,
			...opts,
		});
	}
	/**
	 * 根据模版ID创建页面
	 * @see https://docs.qq.com/open/document/private/openapi/smartcanvas/create_page_by_template.html
	 */
	async createTemplatePage(file_id: string, body: S.CreateTemplatePageRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.CreateTemplatePageResponse>({
			method: 'POST',
			url: `/openapi/smartcanvas/v2/files/${file_id}/templatePage`,
			body,
			...opts,
		});
	}
	/**
	 * 查询顶层页面信息
	 * @see https://docs.qq.com/open/document/private/openapi/smartcanvas/get_first_level_pages.html
	 */
	async getTopPageInfo(file_id: string, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetTopPageInfoResponse>({ url: `/openapi/smartcanvas/v2/files/${file_id}/topPage`, ...opts });
	}
	/**
	 * 查询自动化流程配置
	 * @see https://docs.qq.com/open/document/saas/openapi/smartsheet/automation/get.html
	 */
	async getSmartsheetWorkflowConfig(fileID: string, workflowID: string, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetSmartsheetWorkflowConfigResponse>({
			url: `/openapi/smartsheet/v2/files/${fileID}/${workflowID}`,
			...opts,
		});
	}
	/**
	 * 查询运行详情
	 * @see https://docs.qq.com/open/document/private/openapi/smartsheet/automation/execution_info.html
	 */
	async getFileWorkflowInfo(
		fileID: string,
		workflowID: string,
		body: S.GetFileWorkflowInfoRequest,
		opts?: Partial<RequestOptions<any>>,
	) {
		return this.request<S.GetFileWorkflowInfoResponse>({
			method: 'POST',
			url: `/openapi/smartsheet/v2/files/${fileID}/${workflowID}/info`,
			body,
			...opts,
		});
	}
	/**
	 * 批量查询运行记录
	 * @see https://docs.qq.com/open/document/saas/openapi/smartsheet/automation/execution_list.html
	 */
	async batchQueryExecutionRecords(
		fileID: string,
		workflowID: string,
		body: S.BatchQueryExecutionRecordsRequest,
		opts?: Partial<RequestOptions<any>>,
	) {
		return this.request<S.BatchQueryExecutionRecordsResponse>({
			method: 'POST',
			url: `/openapi/smartsheet/v2/files/${fileID}/${workflowID}/list`,
			body,
			...opts,
		});
	}
	/**
	 * 新增指定成员额外权限
	 * @see https://docs.qq.com/open/document/saas/openapi/smartsheet/contentPermission/add_extra_permission.html
	 */
	async addExtraPermission(fileID: string, body: S.AddExtraPermissionRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.AddExtraPermissionResponse>({
			method: 'POST',
			url: `/openapi/smartsheet/v2/files/${fileID}/addExtraPermission`,
			body,
			...opts,
		});
	}
	/**
	 * 删除指定成员额外权限
	 * @see https://docs.qq.com/open/document/saas/openapi/smartsheet/contentPermission/delete_extra_permission.html
	 */
	async deleteFileExtraPermission(
		fileID: string,
		body: S.DeleteFileExtraPermissionRequest,
		opts?: Partial<RequestOptions<any>>,
	) {
		return this.request<TencentDocsGeneralResponse>({
			method: 'POST',
			url: `/openapi/smartsheet/v2/files/${fileID}/deleteExtraPermission`,
			body,
			...opts,
		});
	}
	/**
	 * 查询子表权限
	 * @see https://docs.qq.com/open/document/private/openapi/smartsheet/contentPermission/get_content_permission.html
	 */
	async getSheetContentPermission(
		fileID: string,
		body: S.GetSheetContentPermissionRequest,
		opts?: Partial<RequestOptions<any>>,
	) {
		return this.request<S.GetSheetContentPermissionResponse>({
			method: 'POST',
			url: `/openapi/smartsheet/v2/files/${fileID}/getSheetContentPermission`,
			body,
			...opts,
		});
	}
	/**
	 * 查询子表
	 * @see https://docs.qq.com/open/document/saas/openapi/smartsheet/sheet/get.html
	 */
	async getSheets(fileID: string, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetSheetsResponse>({ url: `/openapi/smartsheet/v2/files/${fileID}/sheets`, ...opts });
	}
	/**
	 * 添加字段
	 * @see https://docs.qq.com/open/document/saas/openapi/smartsheet/field/add.html
	 */
	async addFields(fileID: string, sheetID: string, body: S.AddFieldsRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.AddFieldsResponse>({
			method: 'POST',
			url: `/openapi/smartsheet/v2/files/${fileID}/sheets/${sheetID}/fields`,
			body,
			...opts,
		});
	}
	/**
	 * 查询字段
	 * @see https://docs.qq.com/open/document/private/openapi/smartsheet/field/get.html
	 */
	async listFields(fileID: string, sheetID: string, body: S.ListFieldsRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.ListFieldsResponse>({
			method: 'POST',
			url: `/openapi/smartsheet/v2/files/${fileID}/sheets/${sheetID}/fields:list`,
			body,
			...opts,
		});
	}
	/**
	 * 添加记录
	 * @see https://docs.qq.com/open/document/private/openapi/smartsheet/record/add.html
	 */
	async addRecords(fileID: string, sheetID: string, body: S.AddRecordsRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.AddRecordsResponse>({
			method: 'POST',
			url: `/openapi/smartsheet/v2/files/${fileID}/sheets/${sheetID}/records`,
			body,
			...opts,
		});
	}
	/**
	 * 查询记录
	 * @see https://docs.qq.com/open/document/saas/openapi/smartsheet/record/get.html
	 */
	async listRecords(fileID: string, sheetID: string, body: S.ListRecordsRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.ListRecordsResponse>({
			method: 'POST',
			url: `/openapi/smartsheet/v2/files/${fileID}/sheets/${sheetID}/records:list`,
			body,
			...opts,
		});
	}
	/**
	 * 添加视图
	 * @see https://docs.qq.com/open/document/saas/openapi/smartsheet/view/add.html
	 */
	async addView(fileID: string, sheetID: string, body: S.AddViewRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.AddViewResponse>({
			method: 'POST',
			url: `/openapi/smartsheet/v2/files/${fileID}/sheets/${sheetID}/views`,
			body,
			...opts,
		});
	}
	/**
	 * 更新指定成员额外权限
	 * @see https://docs.qq.com/open/document/saas/openapi/smartsheet/contentPermission/update_member_extra_permission.html
	 */
	async updateFileMemberExtraPermission(
		fileID: string,
		body: S.UpdateFileMemberExtraPermissionRequest,
		opts?: Partial<RequestOptions<any>>,
	) {
		return this.request<TencentDocsGeneralResponse>({
			method: 'POST',
			url: `/openapi/smartsheet/v2/files/${fileID}/updateMemberExtraPermission`,
			body,
			...opts,
		});
	}
	/**
	 * 更新子表权限
	 * @see https://docs.qq.com/open/document/private/openapi/smartsheet/contentPermission/update_content_permission.html
	 */
	async updateSheetContentPermission(
		fileID: string,
		body: S.UpdateSheetContentPermissionRequest,
		opts?: Partial<RequestOptions<any>>,
	) {
		return this.request<TencentDocsGeneralResponse>({
			method: 'POST',
			url: `/openapi/smartsheet/v2/files/${fileID}/updateSheetContentPermission`,
			body,
			...opts,
		});
	}
	/**
	 * 搜索空间内文档
	 * @see https://docs.qq.com/open/document/private/openapi/space/search.html
	 */
	async searchSpaceDocuments(
		spaceid: string,
		body: S.SearchSpaceDocumentsRequest,
		opts?: Partial<RequestOptions<any>>,
	) {
		return this.request<S.SearchSpaceDocumentsResponse>({
			method: 'POST',
			url: `/openapi/space/${spaceid}/search`,
			body,
			...opts,
		});
	}
	/**
	 * 获取空间的可见范围
	 * @see https://docs.qq.com/open/document/private/openapi/space/get_viewrange.html
	 */
	async getSpaceViewRange(spaceId: string, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetSpaceViewRangeResponse>({ url: `/openapi/space/${spaceId}/viewrange`, ...opts });
	}
	/**
	 * 创建空间
	 * @see https://docs.qq.com/open/document/private/openapi/space/create_space.html
	 */
	async createSpace(body: S.CreateSpaceRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.CreateSpaceResponse>({ method: 'POST', url: '/openapi/space/create', body, ...opts });
	}
	/**
	 * 删除空间
	 * @see https://docs.qq.com/open/document/private/openapi/space/delete_space.html
	 */
	async deleteSpace(spaceId: string, body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<TencentDocsGeneralResponse>({
			method: 'DELETE',
			url: `/openapi/space/delete/${spaceId}`,
			body,
			...opts,
		});
	}
	/**
	 * 空间详情
	 * @see https://docs.qq.com/open/document/private/openapi/space/space_info.html
	 */
	async getSpaceInfo(spaceId: string, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetSpaceInfoResponse>({ url: `/openapi/space/info/${spaceId}`, ...opts });
	}
	/**
	 * 空间列表
	 * @see https://docs.qq.com/open/document/private/openapi/space/space_list.html
	 */
	async listSpaces(body: S.ListSpacesRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.ListSpacesResponse>({ method: 'POST', url: '/openapi/space/list', body, ...opts });
	}
	/**
	 * 创建空间节点
	 * @see https://docs.qq.com/open/document/private/openapi/space/create_node.html
	 */
	async createSpaceNode(body: S.CreateSpaceNodeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.CreateSpaceNodeResponse>({
			method: 'POST',
			url: '/openapi/space/node/create',
			body,
			...opts,
		});
	}
	/**
	 * 删除空间节点
	 * @see https://docs.qq.com/open/document/private/openapi/space/delete_node.html
	 */
	async deleteSpaceNode(body: S.DeleteSpaceNodeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<TencentDocsGeneralResponse>({
			method: 'DELETE',
			url: '/openapi/space/node/delete',
			body,
			...opts,
		});
	}
	/**
	 * 查询空间子节点
	 * @see https://docs.qq.com/open/document/private/openapi/space/querychild.html
	 */
	async querySpaceChildNodes(body: S.QuerySpaceChildNodesRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.QuerySpaceChildNodesResponse>({
			method: 'POST',
			url: '/openapi/space/node/querychild',
			body,
			...opts,
		});
	}
	/**
	 * 查询空间顶级节点
	 * @see https://docs.qq.com/open/document/private/openapi/space/querytop.html
	 */
	async queryTopNode(spaceId: string, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.QueryTopNodeResponse>({ url: `/openapi/space/node/querytop/${spaceId}`, ...opts });
	}
	/**
	 * 获取空间统计信息
	 * @see https://docs.qq.com/open/document/private/openapi/space/space_statistics.html
	 */
	async getSpaceStatistics(opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetSpaceStatisticsResponse>({ url: '/openapi/space/statistics', ...opts });
	}
	/**
	 * 查询工作表信息
	 * @see https://docs.qq.com/open/document/private/openapi/sheet/get/get_sheet.html
	 */
	async getSpreadsheetInfo(fileId: string, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetSpreadsheetInfoResponse>({ url: `/openapi/spreadsheet/v3/files/${fileId}`, ...opts });
	}
	/**
	 * 获取范围内的表格信息
	 * @see https://docs.qq.com/open/document/app/openapi/v3/sheet/get/get_range.html
	 */
	async getSpreadsheetRangeData(fileId: string, sheetId: string, range: string, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.GetSpreadsheetRangeDataResponse>({
			url: `/openapi/spreadsheet/v3/files/${fileId}/${sheetId}/${range}`,
			...opts,
		});
	}
	/**
	 * 在线表格批量更新接口
	 * @see https://docs.qq.com/open/document/app/openapi/v3/sheet/batchupdate/update.html
	 */
	async batchUpdateSpreadsheet(
		fileId: string,
		body: S.BatchUpdateSpreadsheetRequest,
		opts?: Partial<RequestOptions<any>>,
	) {
		return this.request<S.BatchUpdateSpreadsheetResponse>({
			method: 'POST',
			url: `/openapi/spreadsheet/v3/files/${fileId}/batchUpdate`,
			body,
			...opts,
		});
	}
	/**
	 * 新建文档
	 * @see https://docs.qq.com/open/document/app/openapi/v1/file/files/create.html
	 */
	async createDoc(body: S.CreateDocRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<S.CreateDocResponse>({ method: 'POST', url: '/openapi/v1/doc/create', body, ...opts });
	}
	// prettier-ignore-end
	// endregion generated-apis

	async request<T>(o: RequestOptions): Promise<T> {
		const headers: Record<string, any> = { ...o.headers };
		headers['Access-Token'] ??= await this.getAccessToken();
		headers['Client-Id'] ??= this.options.clientId;
		if (this.options.openId) {
			headers['Open-Id'] ??= this.options.openId;
		}
		o.headers = headers;
		o.debug ??= this.options.debug;
		return request(o);
	}
}
