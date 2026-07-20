import { describe, expect, it } from 'vitest';
import { buildMarkdownFromDocBlock, type FeishuBlock } from './feishuDocxToMarkdown';

function makeBlock(
	id: string,
	type: number,
	data: Record<string, any> = {},
	parentId = '',
	children?: string[],
): FeishuBlock {
	return { block_id: id, block_type: type, parent_id: parentId, children, ...data } as FeishuBlock;
}

function textElements(text: string, style?: Record<string, any>) {
	return { elements: [{ text_run: { content: text, text_element_style: style } }] };
}

describe('buildMarkdownFromDocBlock', () => {
	it('should skip duplicate H1 matching page title', () => {
		const blocks: FeishuBlock[] = [
			makeBlock('page', 1, { page: textElements('My Title') }, '', ['h1', 'p1']),
			makeBlock('h1', 3, { heading1: textElements('My Title') }, 'page'),
			makeBlock('p1', 2, { text: textElements('Hello') }, 'page'),
		];
		const md = buildMarkdownFromDocBlock(blocks);
		// Should only have one "# My Title", not two
		expect(md.match(/# My Title/g)?.length).toBe(1);
		expect(md).toContain('Hello');
	});

	it('should not skip H1 if different from page title', () => {
		const blocks: FeishuBlock[] = [
			makeBlock('page', 1, { page: textElements('Page Title') }, '', ['h1']),
			makeBlock('h1', 3, { heading1: textElements('Different Heading') }, 'page'),
		];
		const md = buildMarkdownFromDocBlock(blocks);
		expect(md).toContain('# Page Title');
		expect(md).toContain('# Different Heading');
	});

	it('should number ordered list items sequentially', () => {
		const blocks: FeishuBlock[] = [
			makeBlock('page', 1, { page: textElements('') }, '', ['o1', 'o2', 'o3']),
			makeBlock('o1', 13, { ordered: textElements('First') }, 'page'),
			makeBlock('o2', 13, { ordered: textElements('Second') }, 'page'),
			makeBlock('o3', 13, { ordered: textElements('Third') }, 'page'),
		];
		const md = buildMarkdownFromDocBlock(blocks, { includeTitle: false });
		expect(md).toContain('1. First');
		expect(md).toContain('2. Second');
		expect(md).toContain('3. Third');
	});

	it('should reset ordered list counter after non-ordered block', () => {
		const blocks: FeishuBlock[] = [
			makeBlock('page', 1, { page: textElements('') }, '', ['o1', 'o2', 'p1', 'o3']),
			makeBlock('o1', 13, { ordered: textElements('A') }, 'page'),
			makeBlock('o2', 13, { ordered: textElements('B') }, 'page'),
			makeBlock('p1', 2, { text: textElements('break') }, 'page'),
			makeBlock('o3', 13, { ordered: textElements('C') }, 'page'),
		];
		const md = buildMarkdownFromDocBlock(blocks, { includeTitle: false });
		expect(md).toContain('1. A');
		expect(md).toContain('2. B');
		expect(md).toContain('1. C'); // reset after text block
	});

	it('should render nested ordered lists with proper numbering', () => {
		const blocks: FeishuBlock[] = [
			makeBlock('page', 1, { page: textElements('') }, '', ['o1']),
			makeBlock('o1', 13, { ordered: textElements('Parent') }, 'page', ['c1', 'c2']),
			makeBlock('c1', 13, { ordered: textElements('Child A') }, 'o1'),
			makeBlock('c2', 13, { ordered: textElements('Child B') }, 'o1'),
		];
		const md = buildMarkdownFromDocBlock(blocks, { includeTitle: false });
		expect(md).toContain('1. Parent');
		expect(md).toContain('  1. Child A');
		expect(md).toContain('  2. Child B');
	});

	it('should handle strikethrough + inline_code', () => {
		const blocks: FeishuBlock[] = [
			makeBlock('page', 1, { page: textElements('') }, '', ['p1']),
			makeBlock(
				'p1',
				2,
				{
					text: {
						elements: [
							{
								text_run: {
									content: 'max-tokens-3-5-sonnet',
									text_element_style: { strikethrough: true, inline_code: true },
								},
							},
						],
					},
				},
				'page',
			),
		];
		const md = buildMarkdownFromDocBlock(blocks, { includeTitle: false });
		expect(md).toContain('~~`max-tokens-3-5-sonnet`~~');
	});

	it('should handle strikethrough + bold', () => {
		const blocks: FeishuBlock[] = [
			makeBlock('page', 1, { page: textElements('') }, '', ['p1']),
			makeBlock(
				'p1',
				2,
				{
					text: {
						elements: [
							{
								text_run: {
									content: 'deleted bold text',
									text_element_style: { strikethrough: true, bold: true },
								},
							},
						],
					},
				},
				'page',
			),
		];
		const md = buildMarkdownFromDocBlock(blocks, { includeTitle: false });
		expect(md).toContain('~~**deleted bold text**~~');
	});

	it('should render callout with emoji', () => {
		const blocks: FeishuBlock[] = [
			makeBlock('page', 1, { page: textElements('') }, '', ['c1']),
			makeBlock('c1', 19, { callout: { emoji_id: 'warning' } }, 'page', ['t1']),
			makeBlock('t1', 2, { text: textElements('Watch out!') }, 'c1'),
		];
		const md = buildMarkdownFromDocBlock(blocks, { includeTitle: false });
		expect(md).toContain('> **warning**');
		expect(md).toContain('Watch out!');
	});

	it('should render table with correct structure', () => {
		const blocks: FeishuBlock[] = [
			makeBlock('page', 1, { page: textElements('') }, '', ['t1']),
			makeBlock(
				't1',
				31,
				{
					table: {
						cells: ['c1', 'c2', 'c3', 'c4'],
						property: { row_size: 2, column_size: 2 },
					},
				},
				'page',
				['c1', 'c2', 'c3', 'c4'],
			),
			makeBlock('c1', 32, {}, 't1', ['h1']),
			makeBlock('c2', 32, {}, 't1', ['h2']),
			makeBlock('c3', 32, {}, 't1', ['d1']),
			makeBlock('c4', 32, {}, 't1', ['d2']),
			makeBlock('h1', 2, { text: textElements('Name') }, 'c1'),
			makeBlock('h2', 2, { text: textElements('Value') }, 'c2'),
			makeBlock('d1', 2, { text: textElements('key') }, 'c3'),
			makeBlock('d2', 2, { text: textElements('val') }, 'c4'),
		];
		const md = buildMarkdownFromDocBlock(blocks, { includeTitle: false });
		expect(md).toContain('| Name | Value |');
		expect(md).toContain('| --- | --- |');
		expect(md).toContain('| key | val |');
	});

	it('should compact consecutive list items without blank lines', () => {
		const blocks: FeishuBlock[] = [
			makeBlock('page', 1, { page: textElements('') }, '', ['b1', 'b2', 'b3']),
			makeBlock('b1', 12, { bullet: textElements('Apple') }, 'page'),
			makeBlock('b2', 12, { bullet: textElements('Banana') }, 'page'),
			makeBlock('b3', 12, { bullet: textElements('Cherry') }, 'page'),
		];
		const md = buildMarkdownFromDocBlock(blocks, { includeTitle: false });
		expect(md).toBe('- Apple\n- Banana\n- Cherry\n');
	});

	it('should render task block as indented sub-item under todo', () => {
		const blocks: FeishuBlock[] = [
			makeBlock('page', 1, { page: textElements('') }, '', ['todo1']),
			makeBlock(
				'todo1',
				17,
				{ todo: { ...textElements('实现 disconnect_strategy'), style: { done: false } } },
				'page',
				['task1'],
			),
			makeBlock('task1', 35, { task: { task_id: '8b6fdfb1-5a02-4da8-9ef1-e4c5063d2bf9' } }, 'todo1'),
		];
		const md = buildMarkdownFromDocBlock(blocks, { includeTitle: false });
		expect(md).toContain('- [ ] 实现 disconnect_strategy');
		expect(md).toContain(
			'  - [任务](https://applink.feishu.cn/client/todo/detail?guid=8b6fdfb1-5a02-4da8-9ef1-e4c5063d2bf9)',
		);
		expect(md).not.toMatch(/disconnect_strategy\[任务\]/);
	});

	it('should render task with entityInfo summary', () => {
		const blocks: FeishuBlock[] = [
			makeBlock('page', 1, { page: textElements('') }, '', ['todo1']),
			makeBlock('todo1', 17, { todo: { ...textElements('功能开发'), style: { done: false } } }, 'page', ['task1']),
			makeBlock('task1', 35, { task: { task_id: 'abc-123' } }, 'todo1'),
		];
		const md = buildMarkdownFromDocBlock(blocks, {
			includeTitle: false,
			entityInfo: {
				'task:abc-123': { label: '完成 API 对接 @张三 03-26' },
			},
		});
		expect(md).toContain('  - [完成 API 对接 @张三 03-26](https://applink.feishu.cn/client/todo/detail?guid=abc-123)');
	});

	it('should render top-level task without bullet prefix', () => {
		const blocks: FeishuBlock[] = [
			makeBlock('page', 1, { page: textElements('') }, '', ['task1']),
			makeBlock('task1', 35, { task: { task_id: 'abc-123' } }, 'page'),
		];
		const md = buildMarkdownFromDocBlock(blocks, { includeTitle: false });
		expect(md).toContain('[任务](https://applink.feishu.cn/client/todo/detail?guid=abc-123)');
		expect(md).not.toContain('- [任务]');
	});

	it('should render mention_user with entityInfo name', () => {
		const blocks: FeishuBlock[] = [
			makeBlock('page', 1, { page: textElements('') }, '', ['p1']),
			makeBlock(
				'p1',
				2,
				{
					text: { elements: [{ text_run: { content: '联系 ' } }, { mention_user: { user_id: 'ou_abc123' } }] },
				},
				'page',
			),
		];
		const md = buildMarkdownFromDocBlock(blocks, {
			includeTitle: false,
			entityInfo: { 'user:ou_abc123': { label: '张三' } },
		});
		expect(md).toContain('联系 [@张三]');
	});

	it('should keep blank line before first list item after text', () => {
		const blocks: FeishuBlock[] = [
			makeBlock('page', 1, { page: textElements('') }, '', ['p1', 'b1', 'b2']),
			makeBlock('p1', 2, { text: textElements('Some text') }, 'page'),
			makeBlock('b1', 12, { bullet: textElements('Item A') }, 'page'),
			makeBlock('b2', 12, { bullet: textElements('Item B') }, 'page'),
		];
		const md = buildMarkdownFromDocBlock(blocks, { includeTitle: false });
		expect(md).toContain('Some text\n\n- Item A\n- Item B');
	});
});
