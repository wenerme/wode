import { type FeishuBlock, feishuDocxToMarkdown } from '../feishu-docx-markdown';
import { ListWikiNodesInputSchema, ListWikiSpacesInputSchema, ReadWikiInputSchema } from '../schemas';
import type { FeishuMcpContext } from '../server';

function parseWikiToken(input: string): string {
	const match = input.match(/\/wiki\/([A-Za-z0-9]+)/);
	if (match) return match[1];
	return input;
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

export function registerWikiTools(ctx: FeishuMcpContext) {
	const { server, getClient, log, jsonResult, textResult } = ctx;

	server.registerTool(
		'read_wiki',
		{
			description: `Read a wiki document's content. Supports Feishu/Lark wiki URLs or node tokens.
Resolves the wiki node to its underlying document and returns content in the requested format:
- markdown: converts document blocks to well-formatted Markdown (headings, lists, code, tables, etc.)
- raw: returns the API rawContent string
- json: returns block data and node metadata`,
			inputSchema: ReadWikiInputSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ token: input, format }) => {
			log.info(`read_wiki: ${input} format=${format}`);
			try {
				const client = await getClient();
				const token = parseWikiToken(input);

				const nodeRes = await client.wiki.space.getNode({
					params: { token },
				});

				const node = nodeRes.data?.node;
				if (!node) {
					return { content: [{ type: 'text' as const, text: 'Error: Wiki node not found' }], isError: true };
				}

				const objType = node.obj_type;
				const objToken = node.obj_token;

				if (objType !== 'docx' && objType !== 'doc') {
					return jsonResult({
						node,
						message: `Document type "${objType}" does not support content reading. Only docx/doc types are supported.`,
					});
				}

				if (format === 'raw') {
					const contentRes = await client.docx.document.rawContent({
						path: { document_id: objToken! },
						params: { lang: 0 },
					});
					return textResult(contentRes.data?.content || '');
				}

				const blocks = await fetchAllBlocks(client, objToken!);

				if (format === 'json') {
					return jsonResult({
						token,
						title: node.title,
						obj_type: objType,
						obj_token: objToken,
						block_count: blocks.length,
						blocks,
					});
				}

				const markdown = feishuDocxToMarkdown(blocks as FeishuBlock[], { includeTitle: true });
				return textResult(markdown);
			} catch (e: any) {
				return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
			}
		},
	);

	server.registerTool(
		'list_wiki_spaces',
		{
			description: 'List wiki knowledge base spaces accessible to the app.',
			inputSchema: ListWikiSpacesInputSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ page_size, page_token }) => {
			log.info('list_wiki_spaces');
			try {
				const client = await getClient();
				const res = await client.wiki.space.list({
					params: {
						page_size,
						page_token,
					},
				});

				const spaces = (res.data?.items || []).map((s: any) => ({
					space_id: s.space_id,
					name: s.name,
					description: s.description,
					visibility: s.visibility,
				}));

				return jsonResult({
					spaces,
					has_more: !!res.data?.has_more,
					page_token: res.data?.page_token,
				});
			} catch (e: any) {
				return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
			}
		},
	);

	server.registerTool(
		'list_wiki_nodes',
		{
			description: 'List nodes (pages) in a wiki space. Can list root nodes or children of a specific parent node.',
			inputSchema: ListWikiNodesInputSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ space_id, parent_node_token, page_size, page_token }) => {
			log.info(`list_wiki_nodes: space=${space_id}`);
			try {
				const client = await getClient();
				const res = await client.wiki.spaceNode.list({
					path: { space_id },
					params: {
						parent_node_token,
						page_size,
						page_token,
					},
				});

				const nodes = (res.data?.items || []).map((n: any) => ({
					node_token: n.node_token,
					space_id: n.space_id,
					obj_token: n.obj_token,
					obj_type: n.obj_type,
					title: n.title,
					parent_node_token: n.parent_node_token,
					has_child: n.has_child,
				}));

				return jsonResult({
					nodes,
					has_more: !!res.data?.has_more,
					page_token: res.data?.page_token,
				});
			} catch (e: any) {
				return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
			}
		},
	);
}
