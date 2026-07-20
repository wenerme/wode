/**
 * Feishu Document Block to Markdown converter.
 *
 * Standalone module — no external dependencies, pure functions, zero side effects.
 * Input: flat array of blocks from docx.documentBlock.list() API.
 * Output: formatted Markdown string.
 *
 * @module feishu-docx-markdown
 */

// ---- Public API ----

export interface ConvertOptions {
	/** Convert image token to a downloadable URL. Defaults to `![](token)` */
	imageTokenToUrl?: (token: string) => string;
	/** Convert file token to a downloadable URL */
	fileTokenToUrl?: (token: string) => string;
	/** Include document title from the page block. Default: true */
	includeTitle?: boolean;
	/**
	 * Include block IDs as HTML comments for agent-driven editing.
	 * When enabled, each block is prefixed with `<!-- block:BLOCK_ID -->`.
	 * Images/files use block_id in alt text / reference for easy identification.
	 */
	includeBlockId?: boolean;
}

/**
 * Convert an array of Feishu document blocks to a Markdown string.
 *
 * @param blocks - Flat array of blocks from `client.docx.documentBlock.list()`
 * @param options - Conversion options
 * @returns Formatted Markdown string
 */
export function feishuDocxToMarkdown(blocks: FeishuBlock[], options?: ConvertOptions): string {
	const opts: Required<ConvertOptions> = {
		imageTokenToUrl: options?.imageTokenToUrl ?? ((token) => token),
		fileTokenToUrl: options?.fileTokenToUrl ?? ((token) => token),
		includeTitle: options?.includeTitle ?? true,
		includeBlockId: options?.includeBlockId ?? false,
	};

	const blockMap = buildBlockMap(blocks);
	const pageBlock = blocks.find((b) => b.block_type === BlockType.Page);
	if (!pageBlock) return '';

	const lines: string[] = [];

	// Render page title
	if (opts.includeTitle) {
		const titleText = renderElements(getBlockTextData(pageBlock)?.elements, opts);
		if (titleText.trim()) {
			if (opts.includeBlockId) {
				lines.push(`<!-- block:${pageBlock.block_id} -->`);
			}
			lines.push(`# ${titleText.trim()}`);
			lines.push('');
		}
	}

	// Render top-level children in order
	const children = pageBlock.children || [];
	for (const childId of children) {
		const child = blockMap.get(childId);
		if (child) {
			const rendered = renderBlock(child, blockMap, opts, 0);
			if (rendered) {
				lines.push(rendered);
			}
		}
	}

	return (
		lines
			.join('\n')
			.replace(/\n{3,}/g, '\n\n')
			.trim() + '\n'
	);
}

// ---- Block Types (numeric enum matching Feishu API) ----

const BlockType = {
	Page: 1,
	Text: 2,
	Heading1: 3,
	Heading2: 4,
	Heading3: 5,
	Heading4: 6,
	Heading5: 7,
	Heading6: 8,
	Heading7: 9,
	Heading8: 10,
	Heading9: 11,
	Bullet: 12,
	Ordered: 13,
	Code: 14,
	Quote: 15,
	Todo: 17,
	Bitable: 18,
	Callout: 19,
	ChatCard: 20,
	Diagram: 21,
	Divider: 22,
	File: 23,
	Grid: 24,
	GridColumn: 25,
	Iframe: 26,
	Image: 27,
	ISV: 28,
	Mindnote: 29,
	Sheet: 30,
	Table: 31,
	TableCell: 32,
	View: 33,
	QuoteContainer: 34,
	Task: 35,
	OKR: 36,
	Board: 43,
	Undefined: 999,
} as const;

// ---- Code Language Map ----

const CODE_LANG_MAP: Record<number, string> = {
	1: 'text',
	2: 'abap',
	3: 'ada',
	4: 'apache',
	5: 'apex',
	6: 'assembly',
	7: 'bash',
	8: 'csharp',
	9: 'cpp',
	10: 'c',
	11: 'cobol',
	12: 'css',
	13: 'coffeescript',
	14: 'd',
	15: 'dart',
	16: 'delphi',
	17: 'django',
	18: 'dockerfile',
	19: 'erlang',
	20: 'fortran',
	21: 'foxpro',
	22: 'go',
	23: 'groovy',
	24: 'html',
	25: 'htmlbars',
	26: 'http',
	27: 'haskell',
	28: 'json',
	29: 'java',
	30: 'javascript',
	31: 'julia',
	32: 'kotlin',
	33: 'latex',
	34: 'lisp',
	35: 'logo',
	36: 'lua',
	37: 'matlab',
	38: 'makefile',
	39: 'markdown',
	40: 'nginx',
	41: 'objectivec',
	42: 'openedge-abl',
	43: 'php',
	44: 'perl',
	45: 'postscript',
	46: 'powershell',
	47: 'prolog',
	48: 'protobuf',
	49: 'python',
	50: 'r',
	51: 'rpg',
	52: 'ruby',
	53: 'rust',
	54: 'sas',
	55: 'scss',
	56: 'sql',
	57: 'scala',
	58: 'scheme',
	59: 'scratch',
	60: 'shell',
	61: 'swift',
	62: 'thrift',
	63: 'typescript',
	64: 'vbscript',
	65: 'vb',
	66: 'xml',
	67: 'yaml',
	68: 'cmake',
	69: 'diff',
	70: 'gherkin',
	71: 'graphql',
	72: 'glsl',
	73: 'properties',
	74: 'solidity',
	75: 'toml',
};

// ---- Types (minimal, matching Feishu API response shape) ----

export interface FeishuBlock {
	block_id: string;
	block_type: number;
	parent_id: string;
	children?: string[];
	// Each block type has its own data field
	page?: FeishuTextData;
	text?: FeishuTextData;
	heading1?: FeishuTextData;
	heading2?: FeishuTextData;
	heading3?: FeishuTextData;
	heading4?: FeishuTextData;
	heading5?: FeishuTextData;
	heading6?: FeishuTextData;
	heading7?: FeishuTextData;
	heading8?: FeishuTextData;
	heading9?: FeishuTextData;
	bullet?: FeishuTextData;
	ordered?: FeishuTextData;
	code?: FeishuTextData;
	quote?: FeishuTextData;
	todo?: FeishuTextData;
	callout?: { background_color?: number; border_color?: number; text_color?: number; emoji_id?: string };
	divider?: Record<string, never>;
	file?: { token?: string; name?: string; view_type?: number };
	grid?: { column_size: number };
	grid_column?: { width_ratio?: number };
	iframe?: { component?: { type?: number; url?: string } };
	image?: { token?: string; width?: number; height?: number; align?: number };
	table?: {
		cells?: string[];
		property: {
			row_size: number;
			column_size: number;
			column_width?: number[];
			merge_info?: Array<{ row_span?: number; col_span?: number }>;
		};
	};
	table_cell?: Record<string, never>;
	view?: { view_type?: number };
	quote_container?: Record<string, never>;
	board?: { token?: string; align?: number };
	sheet?: { token?: string };
	bitable?: { token?: string };
	mindnote?: { token?: string };
	task?: { task_id?: string };
	[key: string]: unknown;
}

export interface FeishuTextData {
	elements?: FeishuTextElement[];
	style?: {
		align?: number;
		done?: boolean;
		folded?: boolean;
		language?: number;
		wrap?: boolean;
	};
}

export interface FeishuTextElement {
	text_run?: {
		content: string;
		text_element_style?: FeishuTextElementStyle;
	};
	mention_user?: {
		user_id: string;
		text_element_style?: FeishuTextElementStyle;
	};
	mention_doc?: {
		token: string;
		obj_type: number;
		url: string;
		title?: string;
		text_element_style?: FeishuTextElementStyle;
	};
	reminder?: {
		create_user_id: string;
		is_whole_day?: boolean;
		expire_time: number;
		text_element_style?: FeishuTextElementStyle;
	};
	equation?: {
		content: string;
		text_element_style?: FeishuTextElementStyle;
	};
	file?: {
		file_token?: string;
		source_block_id?: string;
		text_element_style?: FeishuTextElementStyle;
	};
	inline_block?: {
		block_id?: string;
		text_element_style?: FeishuTextElementStyle;
	};
}

export interface FeishuTextElementStyle {
	bold?: boolean;
	italic?: boolean;
	strikethrough?: boolean;
	underline?: boolean;
	inline_code?: boolean;
	text_color?: number;
	background_color?: number;
	link?: { url?: string };
	comment_ids?: string[];
}

// ---- Internal: Block ID annotation ----

/** Prefix content with block ID comment when includeBlockId is enabled */
function annotateBlock(blockId: string, content: string, opts: Required<ConvertOptions>): string {
	if (!opts.includeBlockId || !content.trim()) return content;
	return `<!-- block:${blockId} -->\n${content}`;
}

// ---- Internal: Block Map ----

function buildBlockMap(blocks: FeishuBlock[]): Map<string, FeishuBlock> {
	const map = new Map<string, FeishuBlock>();
	for (const block of blocks) {
		map.set(block.block_id, block);
	}
	return map;
}

// ---- Internal: Get text data from a block by its type ----

function getBlockTextData(block: FeishuBlock): FeishuTextData | undefined {
	const type = block.block_type;
	if (type === BlockType.Page) return block.page;
	if (type === BlockType.Text) return block.text;
	if (type === BlockType.Heading1) return block.heading1;
	if (type === BlockType.Heading2) return block.heading2;
	if (type === BlockType.Heading3) return block.heading3;
	if (type === BlockType.Heading4) return block.heading4;
	if (type === BlockType.Heading5) return block.heading5;
	if (type === BlockType.Heading6) return block.heading6;
	if (type === BlockType.Heading7) return block.heading7;
	if (type === BlockType.Heading8) return block.heading8;
	if (type === BlockType.Heading9) return block.heading9;
	if (type === BlockType.Bullet) return block.bullet;
	if (type === BlockType.Ordered) return block.ordered;
	if (type === BlockType.Code) return block.code;
	if (type === BlockType.Quote) return block.quote;
	if (type === BlockType.Todo) return block.todo;
	return undefined;
}

// ---- Internal: Render inline elements with styles ----

function renderElements(elements: FeishuTextElement[] | undefined, opts: Required<ConvertOptions>): string {
	if (!elements || elements.length === 0) return '';

	const parts: string[] = [];
	for (const el of elements) {
		if (el.text_run) {
			const { content, text_element_style: style } = el.text_run;
			if (!content) continue;
			let text = content;

			// Apply inline styles (innermost first)
			if (style?.inline_code) {
				text = `\`${text}\``;
			} else {
				// Escape markdown special chars in non-code text
				// Only escape pipes inside table cells (handled separately)
				if (style?.strikethrough) text = `~~${text}~~`;
				if (style?.bold && style?.italic) text = `***${text}***`;
				else if (style?.bold) text = `**${text}**`;
				else if (style?.italic) text = `*${text}*`;
			}

			if (style?.link?.url) {
				const url = decodeURIComponent(style.link.url);
				text = `[${content}](${url})`;
			}

			parts.push(text);
		} else if (el.mention_doc) {
			const { title, url, token } = el.mention_doc;
			const displayTitle = title || token;
			const decodedUrl = url ? decodeURIComponent(url) : '';
			parts.push(decodedUrl ? `[${displayTitle}](${decodedUrl})` : displayTitle);
		} else if (el.mention_user) {
			parts.push(`@${el.mention_user.user_id}`);
		} else if (el.equation) {
			parts.push(`$${el.equation.content}$`);
		} else if (el.reminder) {
			const date = new Date(el.reminder.expire_time);
			parts.push(el.reminder.is_whole_day ? date.toLocaleDateString() : date.toLocaleString());
		} else if (el.file) {
			if (el.file.file_token) {
				parts.push(`[file](${opts.fileTokenToUrl(el.file.file_token)})`);
			}
		}
	}

	return parts.join('');
}

// ---- Internal: Render a single block ----

function renderBlock(
	block: FeishuBlock,
	blockMap: Map<string, FeishuBlock>,
	opts: Required<ConvertOptions>,
	indent: number,
): string {
	const type = block.block_type;
	const prefix = '  '.repeat(indent);
	const bid = block.block_id;

	// --- Headings ---
	if (type >= BlockType.Heading1 && type <= BlockType.Heading9) {
		const level = type - BlockType.Heading1 + 1;
		const text = renderElements(getBlockTextData(block)?.elements, opts).trim();
		if (!text) return '';
		return annotateBlock(bid, `${'#'.repeat(level)} ${text}\n`, opts);
	}

	// --- Text paragraph ---
	if (type === BlockType.Text) {
		const text = renderElements(block.text?.elements, opts);
		if (!text.trim()) return '';
		return annotateBlock(bid, `${prefix}${text}\n`, opts);
	}

	// --- Bullet list ---
	if (type === BlockType.Bullet) {
		const text = renderElements(block.bullet?.elements, opts);
		let result = `${prefix}- ${text}\n`;
		result += renderChildren(block, blockMap, opts, indent + 1);
		return annotateBlock(bid, result, opts);
	}

	// --- Ordered list ---
	if (type === BlockType.Ordered) {
		const text = renderElements(block.ordered?.elements, opts);
		let result = `${prefix}1. ${text}\n`;
		result += renderChildren(block, blockMap, opts, indent + 1);
		return annotateBlock(bid, result, opts);
	}

	// --- Code block ---
	if (type === BlockType.Code) {
		const textData = block.code;
		const text = renderElements(textData?.elements, opts);
		const lang = CODE_LANG_MAP[textData?.style?.language || 1] || '';
		return annotateBlock(bid, `\`\`\`${lang}\n${text}\n\`\`\`\n`, opts);
	}

	// --- Quote ---
	if (type === BlockType.Quote) {
		const text = renderElements(block.quote?.elements, opts);
		return annotateBlock(bid, `> ${text}\n`, opts);
	}

	// --- Quote container ---
	if (type === BlockType.QuoteContainer) {
		const children = block.children || [];
		const lines: string[] = [];
		for (const childId of children) {
			const child = blockMap.get(childId);
			if (child) {
				const rendered = renderBlock(child, blockMap, opts, 0).trim();
				if (rendered) {
					// Prefix each line with >
					for (const line of rendered.split('\n')) {
						lines.push(`> ${line}`);
					}
				}
			}
		}
		return annotateBlock(bid, lines.join('\n') + '\n', opts);
	}

	// --- Todo ---
	if (type === BlockType.Todo) {
		const textData = block.todo;
		const text = renderElements(textData?.elements, opts);
		const checked = textData?.style?.done ? 'x' : ' ';
		let result = `${prefix}- [${checked}] ${text}\n`;
		result += renderChildren(block, blockMap, opts, indent + 1);
		return annotateBlock(bid, result, opts);
	}

	// --- Callout (rendered as blockquote with emoji) ---
	if (type === BlockType.Callout) {
		const emoji = block.callout?.emoji_id ? `**${block.callout.emoji_id}** ` : '';
		const children = block.children || [];
		const lines: string[] = [];
		for (const childId of children) {
			const child = blockMap.get(childId);
			if (child) {
				const rendered = renderBlock(child, blockMap, opts, 0).trim();
				if (rendered) {
					for (const line of rendered.split('\n')) {
						lines.push(`> ${line}`);
					}
				}
			}
		}
		if (emoji && lines.length > 0) {
			lines[0] = `> ${emoji}${lines[0].replace(/^> /, '')}`;
		}
		return annotateBlock(bid, lines.join('\n') + '\n', opts);
	}

	// --- Divider ---
	if (type === BlockType.Divider) {
		return annotateBlock(bid, '---\n', opts);
	}

	// --- Image ---
	if (type === BlockType.Image) {
		const token = block.image?.token;
		if (!token) return '';
		const alt = opts.includeBlockId ? bid : '';
		return annotateBlock(bid, `![${alt}](${opts.imageTokenToUrl(token)})\n`, opts);
	}

	// --- File ---
	if (type === BlockType.File) {
		const name = block.file?.name || 'file';
		const token = block.file?.token;
		if (!token) return annotateBlock(bid, `[${name}]\n`, opts);
		return annotateBlock(bid, `[${name}](${opts.fileTokenToUrl(token)})\n`, opts);
	}

	// --- Iframe / Embed ---
	if (type === BlockType.Iframe) {
		const url = block.iframe?.component?.url;
		if (!url) return '';
		return annotateBlock(bid, `[embed](${decodeURIComponent(url)})\n`, opts);
	}

	// --- Table ---
	if (type === BlockType.Table) {
		return annotateBlock(bid, renderTable(block, blockMap, opts), opts);
	}

	// --- Table cell (should only be rendered inside table) ---
	if (type === BlockType.TableCell) {
		return '';
	}

	// --- Grid (columns layout — render children sequentially) ---
	if (type === BlockType.Grid || type === BlockType.GridColumn) {
		return annotateBlock(bid, renderChildren(block, blockMap, opts, indent), opts);
	}

	// --- View (container for files etc.) ---
	if (type === BlockType.View) {
		return annotateBlock(bid, renderChildren(block, blockMap, opts, indent), opts);
	}

	// --- Board ---
	if (type === BlockType.Board) {
		const token = block.board?.token;
		return annotateBlock(bid, token ? `[画板](${token})\n` : '[画板]\n', opts);
	}

	// --- Sheet ---
	if (type === BlockType.Sheet) {
		const token = block.sheet?.token;
		return annotateBlock(bid, token ? `[电子表格](${token})\n` : '[电子表格]\n', opts);
	}

	// --- Bitable ---
	if (type === BlockType.Bitable) {
		const token = block.bitable?.token;
		return annotateBlock(bid, token ? `[多维表格](${token})\n` : '[多维表格]\n', opts);
	}

	// --- Mindnote ---
	if (type === BlockType.Mindnote) {
		const token = block.mindnote?.token;
		return annotateBlock(bid, token ? `[思维笔记](${token})\n` : '[思维笔记]\n', opts);
	}

	// --- Task ---
	if (type === BlockType.Task) {
		const taskId = block.task?.task_id;
		return annotateBlock(bid, taskId ? `[任务](${taskId})\n` : '[任务]\n', opts);
	}

	// --- Fallback: try to extract text from any text-like data ---
	const textData = getBlockTextData(block);
	if (textData?.elements) {
		const text = renderElements(textData.elements, opts);
		if (text.trim()) return annotateBlock(bid, `${prefix}${text}\n`, opts);
	}

	// Render children if present
	if (block.children?.length) {
		return annotateBlock(bid, renderChildren(block, blockMap, opts, indent), opts);
	}

	return '';
}

// ---- Internal: Render children of a block ----

function renderChildren(
	block: FeishuBlock,
	blockMap: Map<string, FeishuBlock>,
	opts: Required<ConvertOptions>,
	indent: number,
): string {
	const children = block.children || [];
	if (children.length === 0) return '';

	const parts: string[] = [];
	for (const childId of children) {
		const child = blockMap.get(childId);
		if (child) {
			const rendered = renderBlock(child, blockMap, opts, indent);
			if (rendered) parts.push(rendered);
		}
	}
	return parts.join('');
}

// ---- Internal: Table rendering ----

function renderTable(block: FeishuBlock, blockMap: Map<string, FeishuBlock>, opts: Required<ConvertOptions>): string {
	const tableData = block.table;
	if (!tableData?.property) return '';

	const { row_size, column_size } = tableData.property;
	const cells = tableData.cells || [];

	if (row_size === 0 || column_size === 0 || cells.length === 0) return '';

	// Build 2D table: cells are in row-major order
	const rows: string[][] = [];
	for (let r = 0; r < row_size; r++) {
		const row: string[] = [];
		for (let c = 0; c < column_size; c++) {
			const cellId = cells[r * column_size + c];
			if (cellId) {
				const cellBlock = blockMap.get(cellId);
				if (cellBlock) {
					row.push(renderTableCellContent(cellBlock, blockMap, opts));
				} else {
					row.push('');
				}
			} else {
				row.push('');
			}
		}
		rows.push(row);
	}

	// Escape pipes in cell content
	const escaped = rows.map((row) => row.map((cell) => cell.replace(/\|/g, '\\|').replace(/\n/g, ' ')));

	const lines: string[] = [];

	// Header row
	if (escaped.length > 0) {
		lines.push(`| ${escaped[0].join(' | ')} |`);
		lines.push(`| ${escaped[0].map(() => '---').join(' | ')} |`);
	}

	// Data rows
	for (let i = 1; i < escaped.length; i++) {
		lines.push(`| ${escaped[i].join(' | ')} |`);
	}

	lines.push('');
	return lines.join('\n');
}

function renderTableCellContent(
	cellBlock: FeishuBlock,
	blockMap: Map<string, FeishuBlock>,
	opts: Required<ConvertOptions>,
): string {
	const children = cellBlock.children || [];
	if (children.length === 0) return '';

	const parts: string[] = [];
	for (const childId of children) {
		const child = blockMap.get(childId);
		if (!child) continue;

		const textData = getBlockTextData(child);
		if (textData?.elements) {
			const text = renderElements(textData.elements, opts).trim();
			if (text) parts.push(text);
		} else if (child.block_type === BlockType.Image && child.image?.token) {
			parts.push(`![](${opts.imageTokenToUrl(child.image.token)})`);
		}
	}

	return parts.join(' ');
}
