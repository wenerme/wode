import { implement } from '@orpc/server';
import consola from 'consola';
import type { ConsolaInstance } from 'consola/core';
import { FeishuDocumentServiceContract } from './FeishuDocumentServiceContract';
import type { FeishuDocsClient } from './feishu-docs-client';

export interface FeishuDocumentServiceOptions {
	client: FeishuDocsClient;
	logger?: ConsolaInstance;
}

/**
 * Create Feishu document service implementation
 */
export function createFeishuDocumentServiceImpl({ 
	client, 
	logger = consola.withTag('feishu-document-service') 
}: FeishuDocumentServiceOptions) {
	const os = implement(FeishuDocumentServiceContract);

	return {
		searchDocuments: os.searchDocuments.handler(async ({ input }) => {
			const { searchKey: query, count = 20, docTypes } = input;
			logger.debug('Searching documents', { query, count, docTypes });

			try {
				const response = await client.searchDocuments({
					search_key: query,
					count,
					docs_types: docTypes
				});

				const results = response.docs_entity?.map(doc => ({
					docToken: doc.doc_token,
					docType: doc.doc_type,
					title: doc.title,
					url: doc.url,
					createTime: doc.create_time,
					updateTime: doc.update_time
				})) || [];

				logger.info('Document search completed', {
					query,
					resultCount: results.length,
					hasMore: response.has_more
				});

				return {
					documents: results,
					hasMore: response.has_more || false,
					totalCount: results.length
				};
			} catch (error) {
				logger.error('Document search failed', {
					query,
					error: error instanceof Error ? error.message : String(error)
				});
				throw error;
			}
		}),

		getDocumentContent: os.getDocumentContent.handler(async ({ input }) => {
			const { docToken, docType = 'docx' } = input;
			logger.debug('Getting document content', { docToken, docType });

			try {
				const content = await client.getDocumentContent(docToken, docType);

				logger.info('Document content retrieved', {
					docToken,
					contentLength: content.content.length,
					revision: content.revision
				});

				return {
					docToken,
					content: content.content,
					revision: content.revision,
					title: content.title || 'Untitled'
				};
			} catch (error) {
				logger.error('Failed to get document content', {
					docToken,
					error: error instanceof Error ? error.message : String(error)
				});
				throw error;
			}
		}),

		createDocument: os.createDocument.handler(async ({ input }) => {
			const { title, docType = 'docx', folderToken } = input;
			logger.debug('Creating document', { title, docType, folderToken });

			try {
				const document = await client.createDocument(title, docType, folderToken);

				logger.info('Document created successfully', {
					docToken: document.doc_token,
					title: document.title
				});

				return {
					docToken: document.doc_token,
					title: document.title,
					url: document.url,
					docType: document.doc_type
				};
			} catch (error) {
				logger.error('Failed to create document', {
					title,
					error: error instanceof Error ? error.message : String(error)
				});
				throw error;
			}
		}),

		importDocument: os.importDocument.handler(async ({ input }) => {
			const { markdown, fileName } = input;
			logger.debug('Importing document from markdown', {
				fileName,
				contentLength: markdown.length
			});

			try {
				const document = await client.importDocument(markdown, fileName);

				logger.info('Document imported successfully', {
					docToken: document.doc_token,
					title: document.title
				});

				return {
					docToken: document.doc_token,
					title: document.title,
					url: document.url,
					importStatus: 'success' as const
				};
			} catch (error) {
				logger.error('Failed to import document', {
					fileName,
					error: error instanceof Error ? error.message : String(error)
				});
				throw error;
			}
		}),

		getDocumentMetadata: os.getDocumentMetadata.handler(async ({ input }) => {
			const { docToken } = input;
			logger.debug('Getting document metadata', { docToken });

			try {
				const document = await client.getDocumentMetadata(docToken);

				logger.info('Document metadata retrieved', {
					docToken,
					title: document.title,
					docType: document.doc_type
				});

				return {
					docToken: document.doc_token,
					title: document.title,
					docType: document.doc_type,
					ownerId: document.owner_id || '',
					createTime: document.create_time || '',
					updateTime: document.update_time || '',
					url: document.url || '',
					permissions: {
						canRead: true,
						canWrite: true,
						canShare: false
					}
				};
			} catch (error) {
				logger.error('Failed to get document metadata', {
					docToken,
					error: error instanceof Error ? error.message : String(error)
				});
				throw error;
			}
		}),
	};
}