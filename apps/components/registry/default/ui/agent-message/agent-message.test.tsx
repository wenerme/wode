import type { UIMessage } from 'ai';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import { AgentMessage, formatAgentMessageValue, projectAgentMessageValue } from './index';

function message(id: string, role: UIMessage['role'], parts: UIMessage['parts']): UIMessage {
	return { id, role, parts };
}

describe('AgentMessage', () => {
	it('renders AI SDK 7 role, streaming text, reasoning, multimodal files, sources, steps, and footer slots', () => {
		const value = message('assistant-1', 'assistant', [
			{ type: 'text', text: '**结果**正在生成', state: 'streaming' },
			{ type: 'reasoning', text: '提供方返回的摘要', state: 'done' },
			{ type: 'file', mediaType: 'image/png', filename: 'chart.png', url: 'https://example.com/chart.png' },
			{ type: 'file', mediaType: 'audio/mpeg', filename: 'answer.mp3', url: 'https://example.com/answer.mp3' },
			{ type: 'file', mediaType: 'application/pdf', filename: 'report.pdf', url: 'https://example.com/report.pdf' },
			{ type: 'source-url', sourceId: 'source-1', title: '公开资料', url: 'https://example.com/source' },
			{ type: 'source-document', sourceId: 'source-2', mediaType: 'application/pdf', title: '参考文档' },
			{ type: 'step-start' },
		]);
		const markup = renderToStaticMarkup(
			<AgentMessage
				message={value}
				actions={<button type='button'>复制</button>}
				meta='刚刚'
				usage='128 tokens'
				reasoningLabel={() => '模型提供的推理摘要'}
			/>,
		);
		expect(markup).toContain('data-slot="agent-message"');
		expect(markup).toContain('data-role="assistant"');
		expect(markup).toContain('data-streaming="true"');
		expect(markup).toContain('模型提供的推理摘要');
		expect(markup).toContain('data-media="image"');
		expect(markup).toContain('data-media="audio"');
		expect(markup).toContain('data-media="file"');
		expect(markup).toContain('data-slot="agent-message-source"');
		expect(markup).toContain('步骤 1');
		expect(markup).toContain('data-slot="agent-message-actions"');
		expect(markup).toContain('data-slot="agent-message-usage"');
		expect(markup).toContain('data-slot="agent-message-meta"');
		expect(markup).not.toContain('chain-of-thought');
	});

	it('renders all typed and dynamic tool lifecycle fallbacks without assuming tool schemas', () => {
		const states = [
			{ type: 'tool-search', toolCallId: '1', state: 'input-streaming', input: { q: 'exa' } },
			{ type: 'tool-search', toolCallId: '2', state: 'input-available', input: { q: 'docs' } },
			{
				type: 'dynamic-tool',
				toolName: 'deployPreview',
				toolCallId: '3',
				state: 'approval-requested',
				input: { environment: 'preview' },
				approval: { id: 'approval-3' },
			},
			{
				type: 'dynamic-tool',
				toolName: 'deployPreview',
				toolCallId: '4',
				state: 'approval-responded',
				input: {},
				approval: { id: 'approval-4', approved: true },
			},
			{ type: 'tool-search', toolCallId: '5', state: 'output-available', input: {}, output: { found: 3 } },
			{ type: 'tool-search', toolCallId: '6', state: 'output-error', input: {}, errorText: '上游超时' },
			{
				type: 'dynamic-tool',
				toolName: 'deleteFile',
				toolCallId: '7',
				state: 'output-denied',
				input: { path: '/draft.txt' },
				approval: { id: 'approval-7', approved: false, reason: '用户拒绝' },
			},
		] as unknown as UIMessage['parts'];
		const markup = renderToStaticMarkup(<AgentMessage message={message('tools', 'assistant', states)} />);
		for (const label of ['正在接收参数', '等待执行', '等待批准', '已批准', '已完成', '执行失败', '已拒绝']) {
			expect(markup).toContain(label);
		}
		expect(markup).toContain('deployPreview');
		expect(markup).toContain('用户拒绝');
		expect(markup).toContain('上游超时');
	});

	it('fails visibly for malformed and unknown runtime parts and safely formats cycles', () => {
		const cyclic: Record<string, unknown> = { query: 'test' };
		cyclic.self = cyclic;
		const parts = [
			{ type: 'text' },
			{ type: 'provider-future-part', value: 1 },
			{
				type: 'dynamic-tool',
				toolName: 'inspect',
				toolCallId: '1',
				state: 'output-available',
				input: cyclic,
				output: 1,
			},
		] as unknown as UIMessage['parts'];
		const markup = renderToStaticMarkup(<AgentMessage message={message('malformed', 'assistant', parts)} />);
		expect(markup).toContain('无法显示的消息内容');
		expect(markup).toContain('暂不支持的消息内容：provider-future-part');
		expect(markup).toContain('[Circular]');
	});

	it('bounds tool value projection before serialization without invoking getters or unbounded traps', () => {
		let getterCalls = 0;
		let descriptorCalls = 0;
		const huge = Array.from({ length: 10_000 }, (_, index) => index);
		const deep: Record<string, unknown> = {};
		let cursor = deep;
		for (let index = 0; index < 100; index += 1) {
			const next: Record<string, unknown> = {};
			cursor.next = next;
			cursor = next;
		}
		const cyclic: Record<string, unknown> = {};
		cyclic.self = cyclic;
		const getterValue = Object.create(null) as Record<string, unknown>;
		Object.defineProperty(getterValue, 'secret', {
			enumerable: true,
			get() {
				getterCalls += 1;
				return 'must-not-run';
			},
		});
		const manyKeys = new Proxy(
			Object.fromEntries(Array.from({ length: 1_000 }, (_, index) => [`key-${index}`, index])),
			{
				getOwnPropertyDescriptor(target, key) {
					descriptorCalls += 1;
					return Reflect.getOwnPropertyDescriptor(target, key);
				},
			},
		);
		const throwingProxy = new Proxy(
			{},
			{
				ownKeys() {
					throw new Error('proxy failure');
				},
			},
		);

		const projected = projectAgentMessageValue(
			{
				array: huge,
				cycle: cyclic,
				deep,
				getterValue,
				manyKeys,
				proxy: throwingProxy,
				text: 'x'.repeat(100_000),
			},
			{ maxArrayItems: 4, maxDepth: 5, maxNodes: 80, maxObjectKeys: 6, maxStringLength: 16 },
		);
		const formatted = formatAgentMessageValue(projected, 2_048);
		expect(formatted.length).toBeLessThanOrEqual(2_048);
		expect(formatted).toContain('[Circular]');
		expect(formatted).toContain('[Accessor]');
		expect(formatted).toContain('[已截断]');
		expect(formatted).toContain('[无法读取]');
		expect(getterCalls).toBe(0);
		expect(descriptorCalls).toBeLessThanOrEqual(32);
	});

	it('supports user and system roles plus injectable part renderers', () => {
		const user = renderToStaticMarkup(
			<AgentMessage message={message('user', 'user', [{ type: 'text', text: '你好' }])} />,
		);
		const system = renderToStaticMarkup(
			<AgentMessage message={message('system', 'system', [{ type: 'text', text: '维护窗口' }])} />,
		);
		const custom = renderToStaticMarkup(
			<AgentMessage
				message={message('custom', 'assistant', [{ type: 'data-weather', id: 'weather-1', data: { sunny: true } }])}
				renderPart={({ part }) => (part.type === 'data-weather' ? <output>晴天</output> : undefined)}
			/>,
		);
		expect(user).toContain('data-align="end"');
		expect(user).toContain('>你<');
		expect(system).toContain('>系统<');
		expect(custom).toContain('data-part-type="custom-renderer"');
		expect(custom).toContain('晴天');
	});
});
