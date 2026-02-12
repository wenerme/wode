import { z } from 'zod';

export const ReceiveIdTypeSchema = z
	.enum(['chat_id', 'open_id', 'user_id', 'union_id', 'email'])
	.describe('Type of the receiver ID');

export const SendMessageInputSchema = z.object({
	receive_id: z.string().describe('Receiver ID (chat_id, open_id, user_id, union_id, or email)'),
	receive_id_type: ReceiveIdTypeSchema.default('chat_id'),
	msg_type: z
		.enum(['text', 'post', 'interactive'])
		.default('text')
		.describe('Message type: text, post (rich text), or interactive (card)'),
	content: z
		.string()
		.describe(
			'Message content as JSON string. For text: {"text":"hello"}. For post: rich text JSON. For interactive: card JSON.',
		),
});

export const ReplyMessageInputSchema = z.object({
	message_id: z.string().describe('ID of the message to reply to'),
	msg_type: z.enum(['text', 'post', 'interactive']).default('text').describe('Reply message type'),
	content: z.string().describe('Reply content as JSON string'),
});

export const ListMessagesInputSchema = z.object({
	container_id: z.string().describe('Chat ID to list messages from'),
	start_time: z.string().optional().describe('Start time (Unix timestamp in seconds)'),
	end_time: z.string().optional().describe('End time (Unix timestamp in seconds)'),
	page_size: z.number().min(1).max(50).default(20).describe('Number of messages per page'),
	page_token: z.string().optional().describe('Pagination token'),
});

export const SearchDocumentsInputSchema = z.object({
	search_key: z.string().min(1).describe('Search keyword'),
	count: z.number().min(1).max(50).default(20).describe('Number of results to return'),
	docs_types: z
		.array(z.enum(['docx', 'sheet', 'slides', 'bitable', 'mindnote', 'file', 'wiki']))
		.optional()
		.describe('Filter by document types'),
	owner_ids: z.array(z.string()).optional().describe('Filter by owner user IDs'),
});

export const GetDocumentContentInputSchema = z.object({
	document_id: z.string().min(1).describe('Document ID (token)'),
	lang: z.number().default(0).describe('Language: 0=follow doc language, 1=zh, 2=en, 3=ja'),
});

export const GetDocumentMetadataInputSchema = z.object({
	document_id: z.string().min(1).describe('Document ID (token)'),
});

export const ListChatsInputSchema = z.object({
	page_size: z.number().min(1).max(100).default(20).describe('Number of chats per page'),
	page_token: z.string().optional().describe('Pagination token'),
});

// ---- Document CRUD ----

export const CreateDocumentInputSchema = z.object({
	title: z.string().nullish().describe('Document title'),
	folder_token: z.string().nullish().describe('Parent folder token'),
});

export const WriteDocumentInputSchema = z.object({
	document_id: z.string().min(1).describe('Document ID (token)'),
	content: z.string().min(1).describe('Content to write (markdown or HTML)'),
	content_type: z
		.enum(['markdown', 'html'])
		.default('markdown')
		.describe('Content format: markdown or html'),
	append: z.boolean().default(false).describe('Append instead of replacing existing content'),
});

export const ListBlocksInputSchema = z.object({
	document_id: z.string().min(1).describe('Document ID (token)'),
	page_size: z.number().min(1).max(500).default(50).describe('Number of blocks per page'),
	page_token: z.string().optional().describe('Pagination token'),
});

// ---- Wiki ----

export const ReadWikiInputSchema = z.object({
	token: z
		.string()
		.min(1)
		.describe('Wiki node token or URL (e.g. "QZIzw2sR6idt4ekc0wtcaGbIn6f" or a full feishu.cn/wiki/... URL)'),
	format: z
		.enum(['markdown', 'raw', 'json'])
		.default('markdown')
		.describe('Output format: markdown (block-based), raw (API rawContent), json (block data)'),
});

export const ListWikiSpacesInputSchema = z.object({
	page_size: z.number().min(1).max(50).default(20).describe('Number of spaces per page'),
	page_token: z.string().optional().describe('Pagination token'),
});

export const ListWikiNodesInputSchema = z.object({
	space_id: z.string().min(1).describe('Wiki space ID'),
	parent_node_token: z.string().optional().describe('Parent node token (empty for root)'),
	page_size: z.number().min(1).max(50).default(20).describe('Number of nodes per page'),
	page_token: z.string().optional().describe('Pagination token'),
});
