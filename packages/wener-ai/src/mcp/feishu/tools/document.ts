import { z } from 'zod';
import { type FeishuBlock, feishuDocxToMarkdown } from '../feishu-docx-markdown';
import {
	CreateDocumentInputSchema,
	GetDocumentContentInputSchema,
	GetDocumentMetadataInputSchema,
	ListBlocksInputSchema,
	SearchDocumentsInputSchema,
	WriteDocumentInputSchema,
} from '../schemas';
import type { FeishuMcpContext } from '../server';

const ListFilesInputSchema = z.object({
	page_size: z.number().min(1).max(200).default(50).describe('Number of files per page'),
	page_token: z.string().optional().describe('Pagination token'),
});

export function registerDocumentTools(ctx: FeishuMcpContext) {
	const { server, getClient, log, jsonResult, textResult } = ctx;

	server.registerTool(
		'search_documents',
		{
			description: `Search documents in Feishu/Lark workspace.
Note: This endpoint may require user_access_token. With tenant token, consider using list_files instead.`,
			inputSchema: SearchDocumentsInputSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ search_key, count, docs_types, owner_ids }) => {
			log.info(`search_documents: "${search_key}" count=${count}`);
			try {
				const client = await getClient();
				const res = await client.request({
					method: 'POST',
					url: '/open-apis/suite/docs-api/search/object',
					data: {
						search_key,
						count,
						docs_types,
						owner_ids,
					},
				});

				const entities = res?.data?.docs_entities || res?.data?.docs_entity || [];
				const docs = entities.map((doc: any) => ({
					doc_token: doc.docs_token || doc.doc_token,
					doc_type: doc.docs_type || doc.doc_type,
					title: doc.title,
					owner_id: doc.owner_id,
					url: doc.url,
				}));

				return jsonResult({
					documents: docs,
					has_more: res?.data?.has_more,
					total: docs.length,
				});
			} catch (e: any) {
				const errMsg = e?.response?.data?.msg || e?.message || String(e);
				return { content: [{ type: 'text' as const, text: `Error: ${errMsg}` }], isError: true };
			}
		},
	);

	server.registerTool(
		'list_files',
		{
			description: 'List recently accessed files in the cloud drive. Works with tenant token.',
			inputSchema: ListFilesInputSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ page_size, page_token }) => {
			log.info(`list_files: page_size=${page_size}`);
			try {
				const client = await getClient();
				const res = await client.drive.file.list({
					params: {
						page_size,
						page_token,
					},
				});

				const files = (res.data?.files || []).map((f: any) => ({
					token: f.token,
					name: f.name,
					type: f.type,
					parent_token: f.parent_token,
					created_time: f.created_time,
					modified_time: f.modified_time,
					owner_id: f.owner_id,
					url: f.url,
				}));

				return jsonResult({
					files,
					has_more: !!res.data?.next_page_token,
					page_token: res.data?.next_page_token,
				});
			} catch (e: any) {
				return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
			}
		},
	);

	server.registerTool(
		'get_document_content',
		{
			description: `Get document content. Supports two modes:
- Raw mode (format=raw, default): returns the rawContent API string
- Markdown mode (format=markdown): fetches all blocks and converts to formatted Markdown with headings, lists, code blocks, tables, etc.`,
			inputSchema: GetDocumentContentInputSchema.extend({
				format: z
					.enum(['raw', 'markdown'])
					.default('raw')
					.describe('Output format: raw (API rawContent string) or markdown (block-based conversion)'),
			}),
			annotations: { readOnlyHint: true },
		},
		async ({ document_id, lang, format }) => {
			log.info(`get_document_content: ${document_id} format=${format}`);
			try {
				const client = await getClient();

				if (format === 'markdown') {
					const blocks = await fetchAllBlocks(client, document_id);
					const markdown = feishuDocxToMarkdown(blocks as FeishuBlock[], { includeTitle: true });
					return textResult(markdown);
				}

				const res = await client.docx.document.rawContent({
					path: { document_id },
					params: { lang },
				});
				return textResult(res.data?.content || '');
			} catch (e: any) {
				return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
			}
		},
	);

	server.registerTool(
		'get_document_metadata',
		{
			description: 'Get metadata for a document including title, revision, and word count.',
			inputSchema: GetDocumentMetadataInputSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ document_id }) => {
			log.info(`get_document_metadata: ${document_id}`);
			try {
				const client = await getClient();
				const res = await client.docx.document.get({
					path: { document_id },
				});

				return jsonResult(res.data?.document);
			} catch (e: any) {
				return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
			}
		},
	);

	server.registerTool(
		'create_document',
		{
			description: 'Create a new empty document in Feishu/Lark.',
			inputSchema: CreateDocumentInputSchema,
			annotations: { readOnlyHint: false },
		},
		async ({ title, folder_token }) => {
			log.info(`create_document: title="${title}"`);
			try {
				const client = await getClient();
				const res = await client.docx.document.create({
					data: {
						title: title ?? undefined,
						folder_token: folder_token ?? undefined,
					},
				});
				return jsonResult(res.data?.document);
			} catch (e: any) {
				return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
			}
		},
	);

	server.registerTool(
		'write_document',
		{
			description: `Write markdown or HTML content to a document. Converts content to Feishu blocks and writes them.
By default replaces existing content. Use append=true to add content at the end.
Requires appropriate permissions on the document.`,
			inputSchema: WriteDocumentInputSchema,
			annotations: { readOnlyHint: false },
		},
		async ({ document_id, content, content_type, append }) => {
			log.info(`write_document: ${document_id} type=${content_type} append=${append}`);
			try {
				const client = await getClient();

				const convertRes = await (client.docx.document as any).convert({
					data: { content_type, content },
				});

				const blocks = convertRes.data?.blocks;
				const firstLevelIds: string[] = convertRes.data?.first_level_block_ids || [];
				if (!blocks || blocks.length === 0) {
					return { content: [{ type: 'text' as const, text: 'Error: Convert returned no blocks' }], isError: true };
				}

				if (!append) {
					const docRes = await client.docx.documentBlock.get({
						path: { document_id, block_id: document_id },
						params: { document_revision_id: -1 },
					});
					const existing = (docRes.data?.block as any)?.children || [];
					if (existing.length > 0) {
						await client.docx.documentBlockChildren.batchDelete({
							path: { document_id, block_id: document_id },
							params: { document_revision_id: -1 },
							data: { start_index: 0, end_index: existing.length },
						});
					}
				}

				const descendants = blocks.map(({ parent_id, ...rest }: any) => {
					if (rest.block_type === 31 && rest.table) {
						const { row_size, column_size } = rest.table.property;
						return {
							block_id: rest.block_id,
							block_type: 31,
							table: { property: { row_size, column_size } },
							children: rest.children,
						};
					}
					return rest;
				});

				await client.docx.documentBlockDescendant.create({
					path: { document_id, block_id: document_id },
					data: { children_id: firstLevelIds, descendants },
				});

				return jsonResult({
					document_id,
					blocks_written: firstLevelIds.length,
					total_descendants: blocks.length,
				});
			} catch (e: any) {
				return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
			}
		},
	);

	server.registerTool(
		'list_blocks',
		{
			description:
				'List all blocks in a document. Returns block types, IDs, hierarchy, and content for understanding document structure.',
			inputSchema: ListBlocksInputSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ document_id, page_size, page_token }) => {
			log.info(`list_blocks: ${document_id}`);
			try {
				const client = await getClient();
				const res = await client.docx.documentBlock.list({
					path: { document_id },
					params: {
						page_size,
						page_token,
						document_revision_id: -1,
					},
				});

				return jsonResult({
					blocks: res.data?.items || [],
					has_more: !!res.data?.has_more,
					page_token: res.data?.page_token,
				});
			} catch (e: any) {
				return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
			}
		},
	);
}

async function fetchAllBlocks(client: any, documentId: string): Promise<unknown[]> {
	const blocks: unknown[] = [];
	let pageToken: string | undefined;
	do {
		const res = await client.docx.documentBlock.list({
			path: { document_id: documentId },
			params: { page_size: 500, page_token: pageToken },
		});
		blocks.push(...(res.data?.items || []));
		pageToken = res.data?.has_more ? res.data?.page_token : undefined;
	} while (pageToken);
	return blocks;
}
