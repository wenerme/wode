import {
	FeishuAuth,
	FeishuHttpClient,
	type FeishuConfig,
	type FeishuDocument,
	type FeishuDocumentContent,
	type FeishuDocumentSearchRequest,
	type FeishuDocumentSearchResponse,
} from 'common/feishu';
import consola from 'consola';

const logger = consola.withTag('feishu-docs-client');

export interface FeishuDocumentClient {
	searchDocuments(params: FeishuDocumentSearchRequest): Promise<FeishuDocumentSearchResponse>;
	getDocumentContent(docToken: string, docType: string): Promise<FeishuDocumentContent>;
	createDocument(title: string, docType: string, folderToken?: string): Promise<FeishuDocument>;
	importDocument(markdown: string, fileName?: string): Promise<FeishuDocument>;
	getDocumentMetadata(docToken: string): Promise<FeishuDocument>;
}

/**
 * Enhanced Feishu Document API client with authentication
 */
export class FeishuDocsClient implements FeishuDocumentClient {
	private httpClient: FeishuHttpClient;
	private auth: FeishuAuth;
	private config: FeishuConfig;

	constructor(config: FeishuConfig, auth: FeishuAuth) {
		this.config = config;
		this.auth = auth;
		this.httpClient = new FeishuHttpClient(config);
	}

	/**
	 * Search documents in user's workspace
	 */
	async searchDocuments(params: FeishuDocumentSearchRequest): Promise<FeishuDocumentSearchResponse> {
		try {
			const headers = await this.auth.getAuthHeader('user');

			logger.debug('Searching documents', {
				searchKey: params.search_key,
				count: params.count,
				docTypes: params.docs_types,
			});

			const response = await this.httpClient.post<FeishuDocumentSearchResponse>(
				'/suite/docs-api/search/object',
				params,
				headers,
			);

			logger.info('Document search completed', {
				searchKey: params.search_key,
				resultCount: response.docs_entity?.length || 0,
				hasMore: response.has_more,
			});

			return response;
		} catch (error) {
			logger.error('Document search failed', {
				searchKey: params.search_key,
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	/**
	 * Get document content in markdown format
	 */
	async getDocumentContent(docToken: string, docType: string = 'docx'): Promise<FeishuDocumentContent> {
		try {
			const headers = await this.auth.getAuthHeader('user');

			logger.debug('Getting document content', { docToken, docType });

			const response = await this.httpClient.get<{ content: string; revision: number }>(
				'/docs/v1/content',
				{
					doc_token: docToken,
					doc_type: docType,
					content_type: 'markdown',
					lang: 'zh',
				},
				headers,
			);

			logger.info('Document content retrieved', {
				docToken,
				contentLength: response.content?.length || 0,
				revision: response.revision,
			});

			return {
				content: response.content || '',
				revision: response.revision || 0,
			};
		} catch (error) {
			logger.error('Failed to get document content', {
				docToken,
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	/**
	 * Create a new empty document
	 */
	async createDocument(title: string, docType: string = 'docx', folderToken?: string): Promise<FeishuDocument> {
		try {
			const headers = await this.auth.getAuthHeader('user');

			logger.debug('Creating document', { title, docType, folderToken });

			const requestBody: any = {
				title,
				type: docType,
			};

			if (folderToken) {
				requestBody.folder_token = folderToken;
			}

			const response = await this.httpClient.post<{
				doc_token: string;
				url: string;
				title: string;
			}>(
				'/drive/v1/files/create_folder', // This would be the actual endpoint
				requestBody,
				headers,
			);

			const document: FeishuDocument = {
				doc_token: response.doc_token,
				doc_type: docType as any,
				title: response.title,
				url: response.url,
				create_time: new Date().toISOString(),
				update_time: new Date().toISOString(),
			};

			logger.info('Document created successfully', {
				docToken: document.doc_token,
				title: document.title,
			});

			return document;
		} catch (error) {
			logger.error('Failed to create document', {
				title,
				docType,
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	/**
	 * Import document from markdown content
	 */
	async importDocument(markdown: string, fileName?: string): Promise<FeishuDocument> {
		try {
			const headers = await this.auth.getAuthHeader('user');

			logger.debug('Importing document from markdown', {
				fileName,
				contentLength: markdown.length,
			});

			// Step 1: Upload markdown file
			const uploadResponse = await this.uploadMarkdownFile(markdown, fileName || 'imported-document.md', headers);

			if (!uploadResponse.file_token) {
				throw new Error('File upload failed - no file token received');
			}

			// Step 2: Create import task
			const importResponse = await this.httpClient.post<{
				ticket: string;
			}>(
				'/drive/v1/import_tasks',
				{
					file_extension: 'md',
					file_name: fileName,
					file_token: uploadResponse.file_token,
					type: 'docx',
					point: {
						mount_type: 1,
						mount_key: '',
					},
				},
				headers,
			);

			// Step 3: Wait for import completion
			const importResult = await this.waitForImportCompletion(importResponse.ticket, headers);

			const document: FeishuDocument = {
				doc_token: importResult.doc_token,
				doc_type: 'docx',
				title: fileName || 'Imported Document',
				url: importResult.url,
				create_time: new Date().toISOString(),
				update_time: new Date().toISOString(),
			};

			logger.info('Document imported successfully', {
				docToken: document.doc_token,
				title: document.title,
			});

			return document;
		} catch (error) {
			logger.error('Failed to import document', {
				fileName,
				contentLength: markdown.length,
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	/**
	 * Get document metadata
	 */
	async getDocumentMetadata(docToken: string): Promise<FeishuDocument> {
		try {
			const headers = await this.auth.getAuthHeader('user');

			logger.debug('Getting document metadata', { docToken });

			const response = await this.httpClient.get<FeishuDocument>(
				`/drive/v1/files/${docToken}/meta`,
				undefined,
				headers,
			);

			logger.info('Document metadata retrieved', {
				docToken,
				title: response.title,
				docType: response.doc_type,
			});

			return response;
		} catch (error) {
			logger.error('Failed to get document metadata', {
				docToken,
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	/**
	 * Upload markdown file for import
	 */
	private async uploadMarkdownFile(
		markdown: string,
		fileName: string,
		headers: Record<string, string>,
	): Promise<{ file_token: string }> {
		const blob = new Blob([markdown], { type: 'text/markdown' });

		const formData = new FormData();
		formData.append('file_name', fileName);
		formData.append('parent_type', 'ccm_import_open');
		formData.append('parent_node', '/');
		formData.append('size', blob.size.toString());
		formData.append('file', blob, fileName);
		formData.append('extra', JSON.stringify({ obj_type: 'docx', file_extension: 'md' }));

		// Note: This would need special handling for FormData uploads
		// For now, using a simplified approach
		const response = await this.httpClient.post<{ file_token: string }>(
			'/drive/v1/medias/upload_all',
			{
				file_name: fileName,
				parent_type: 'ccm_import_open',
				parent_node: '/',
				size: Buffer.byteLength(markdown),
				file: markdown, // Simplified - would need proper file upload handling
				extra: JSON.stringify({ obj_type: 'docx', file_extension: 'md' }),
			},
			headers,
		);

		return response;
	}

	/**
	 * Wait for import task completion
	 */
	private async waitForImportCompletion(
		ticket: string,
		headers: Record<string, string>,
	): Promise<{ doc_token: string; url: string }> {
		const maxAttempts = 10;
		const delay = 1000; // 1 second

		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			const response = await this.httpClient.get<{
				result: {
					job_status: number;
					job_error_msg?: string;
					token?: string;
					url?: string;
				};
			}>(`/drive/v1/import_tasks/${ticket}`, undefined, headers);

			const { job_status, job_error_msg, token, url } = response.result;

			if (job_status === 0) {
				// Success
				return {
					doc_token: token!,
					url: url!,
				};
			} else if (job_status === 1 || job_status === 2) {
				// Processing, wait and retry
				await new Promise((resolve) => setTimeout(resolve, delay));
			} else {
				// Failed
				throw new Error(`Import failed: ${job_error_msg || 'Unknown error'}`);
			}
		}

		throw new Error('Import timeout - task did not complete in time');
	}

	/**
	 * Test authentication and connectivity
	 */
	async testConnection(): Promise<boolean> {
		try {
			await this.auth.testToken('user');
			return true;
		} catch (error) {
			logger.error('Connection test failed', { error });
			return false;
		}
	}

	/**
	 * Update authentication tokens
	 */
	updateAuth(auth: FeishuAuth): void {
		this.auth = auth;
	}
}
