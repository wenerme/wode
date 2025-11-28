import { oc } from '@orpc/contract';
import { McpMetaKey } from 'common/mcp';
import { z } from 'zod/v4';

/**
 * Feishu Document Management MCP Service Contract
 * Defines the interface for comprehensive document operations
 */

// Common schemas
const DocumentTypeSchema = z.enum(['docx', 'sheet', 'slides', 'bitable', 'mindnote', 'file']);

// Input schemas
const SearchDocumentsInputSchema = z.object({
	searchKey: z.string().min(1).describe('Search keyword for documents'),
	count: z.number().min(1).max(50).optional().describe('Number of results to return (1-50)').default(10),
	offset: z.number().min(0).optional().describe('Search offset for pagination').default(0),
	ownerIds: z.array(z.string()).optional().describe('Filter by document owner IDs'),
	chatIds: z.array(z.string()).optional().describe('Filter by group/space IDs'),
	docTypes: z.array(DocumentTypeSchema).optional().describe('Filter by document types'),
});

const GetDocumentContentInputSchema = z.object({
	docToken: z.string().min(1).describe('Document token/ID'),
	docType: z.literal('docx').describe('Document type (currently only docx supported)'),
	contentType: z.literal('markdown').describe('Content format (markdown)'),
	lang: z.enum(['zh', 'en', 'ja']).optional().describe('Language for @user mentions').default('zh'),
});

const ImportDocumentInputSchema = z.object({
	markdown: z.string().min(1).describe('Markdown content to import'),
	fileName: z.string().max(27).optional().describe('Document name (max 27 characters)'),
	folderToken: z.string().optional().describe('Target folder token'),
});

const CreateDocumentInputSchema = z.object({
	title: z.string().min(1).max(100).describe('Document title'),
	docType: DocumentTypeSchema.describe('Document type to create'),
	folderToken: z.string().optional().describe('Target folder token'),
});

const GetDocumentMetadataInputSchema = z.object({
	docToken: z.string().min(1).describe('Document token/ID'),
});

const ListRecentDocumentsInputSchema = z.object({
	count: z.number().min(1).max(50).optional().describe('Number of documents to return').default(20),
	docTypes: z.array(DocumentTypeSchema).optional().describe('Filter by document types'),
});

// Output schemas
const DocumentSchema = z.object({
	docToken: z.string().describe('Document token'),
	docType: DocumentTypeSchema.describe('Document type'),
	title: z.string().describe('Document title'),
	ownerId: z.string().optional().describe('Owner user ID'),
	createTime: z.string().optional().describe('Creation timestamp'),
	updateTime: z.string().optional().describe('Last update timestamp'),
	url: z.string().optional().describe('Document URL'),
});

const SearchDocumentsOutputSchema = z.object({
	documents: z.array(DocumentSchema).describe('Search results'),
	hasMore: z.boolean().describe('Whether there are more results'),
	totalCount: z.number().describe('Total number of matching documents'),
});

const DocumentContentOutputSchema = z.object({
	docToken: z.string().describe('Document token'),
	content: z.string().describe('Document content in markdown format'),
	revision: z.number().describe('Document revision number'),
	title: z.string().describe('Document title'),
});

const DocumentMetadataOutputSchema = z.object({
	docToken: z.string().describe('Document token'),
	title: z.string().describe('Document title'),
	docType: DocumentTypeSchema.describe('Document type'),
	ownerId: z.string().describe('Owner user ID'),
	createTime: z.string().describe('Creation timestamp'),
	updateTime: z.string().describe('Last update timestamp'),
	url: z.string().describe('Document URL'),
	permissions: z
		.object({
			canRead: z.boolean().describe('Can read document'),
			canWrite: z.boolean().describe('Can write to document'),
			canShare: z.boolean().describe('Can share document'),
		})
		.describe('User permissions for this document'),
});

const CreateDocumentOutputSchema = z.object({
	docToken: z.string().describe('Created document token'),
	title: z.string().describe('Document title'),
	url: z.string().describe('Document URL'),
	docType: DocumentTypeSchema.describe('Document type'),
});

const ImportDocumentOutputSchema = z.object({
	docToken: z.string().describe('Imported document token'),
	title: z.string().describe('Document title'),
	url: z.string().describe('Document URL'),
	importStatus: z.enum(['success', 'processing', 'failed']).describe('Import status'),
});

const HealthCheckSchema = z.object({
	status: z.enum(['healthy', 'unhealthy']).describe('Health status'),
	service: z.string().describe('Service name'),
	version: z.string().describe('Service version'),
	timestamp: z.string().describe('Health check timestamp'),
	domain: z.string().describe('Feishu API domain'),
	authentication: z
		.object({
			hasAppCredentials: z.boolean().describe('App credentials available'),
			hasUserToken: z.boolean().describe('User access token available'),
			tokenValid: z.boolean().optional().describe('Token validity status'),
		})
		.describe('Authentication status'),
	error: z.string().optional().describe('Error message if unhealthy'),
});

export const FeishuDocumentServiceContract = {
	// Health check tool
	healthCheck: oc
		.input(z.object({}))
		.output(HealthCheckSchema)
		.route({
			description: 'Health check for Feishu document service and authentication status',
			tags: ['feishu', 'documents', 'health'],
		})
		.meta({
			[McpMetaKey.tool]: {
				annotations: {
					readOnlyHint: true,
				},
			},
		}),

	// Document search and discovery
	searchDocuments: oc
		.input(SearchDocumentsInputSchema)
		.output(SearchDocumentsOutputSchema)
		.route({
			description: 'Search documents in user workspace with filtering options',
			tags: ['feishu', 'documents', 'search'],
		})
		.meta({
			[McpMetaKey.tool]: {
				annotations: {
					readOnlyHint: true,
				},
			},
		}),

	listRecentDocuments: oc
		.input(ListRecentDocumentsInputSchema)
		.output(SearchDocumentsOutputSchema)
		.route({
			description: 'List recently accessed documents in user workspace',
			tags: ['feishu', 'documents', 'recent'],
		})
		.meta({
			[McpMetaKey.tool]: {
				annotations: {
					readOnlyHint: true,
				},
			},
		}),

	// Document content operations
	getDocumentContent: oc
		.input(GetDocumentContentInputSchema)
		.output(DocumentContentOutputSchema)
		.route({
			description: 'Get document content in markdown format',
			tags: ['feishu', 'documents', 'content'],
		})
		.meta({
			[McpMetaKey.tool]: {
				annotations: {
					readOnlyHint: true,
				},
			},
		}),

	getDocumentMetadata: oc
		.input(GetDocumentMetadataInputSchema)
		.output(DocumentMetadataOutputSchema)
		.route({
			description: 'Get document metadata and properties',
			tags: ['feishu', 'documents', 'metadata'],
		})
		.meta({
			[McpMetaKey.tool]: {
				annotations: {
					readOnlyHint: true,
				},
			},
		}),

	// Document creation and import
	createDocument: oc
		.input(CreateDocumentInputSchema)
		.output(CreateDocumentOutputSchema)
		.route({
			description: 'Create a new empty document in user workspace',
			tags: ['feishu', 'documents', 'create'],
		})
		.meta({
			[McpMetaKey.tool]: {
				annotations: {
					readOnlyHint: false,
				},
			},
		}),

	importDocument: oc
		.input(ImportDocumentInputSchema)
		.output(ImportDocumentOutputSchema)
		.route({
			description: 'Import markdown content to create a new Feishu document',
			tags: ['feishu', 'documents', 'import'],
		})
		.meta({
			[McpMetaKey.tool]: {
				annotations: {
					readOnlyHint: false,
				},
			},
		}),
};
