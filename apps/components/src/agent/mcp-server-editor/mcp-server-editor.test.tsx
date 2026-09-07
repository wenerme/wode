import { McpServerConfigSchema } from '@wener/ai/mcp';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import { changeMcpTransport, McpServerEditor } from './mcp-server-editor';

describe('McpServerEditor', () => {
	it('renders canonical transport choices and HTTP fields', () => {
		const value = McpServerConfigSchema.parse({
			id: 'mcp-example',
			name: 'example-mcp',
			transport: 'streamable-http',
			url: 'https://mcp.example.com',
			headers: { Authorization: 'placeholder-header' },
			enabled: true,
		});
		const markup = renderToStaticMarkup(<McpServerEditor value={value} onChange={() => undefined} />);
		expect(markup).toContain('role="radiogroup"');
		expect(markup).toContain('streamable-http');
		expect(markup).toContain('Server URL');
		expect(markup).not.toContain('工作目录');
	});

	it('switches to stdio without retaining URL fields', () => {
		const http = McpServerConfigSchema.parse({
			name: 'example-mcp',
			transport: 'sse',
			url: 'https://mcp.example.com/sse',
			headers: { Accept: 'text/event-stream' },
			enabled: true,
		});
		const stdio = changeMcpTransport(http, 'stdio');
		expect(stdio.transport).toBe('stdio');
		expect('url' in stdio).toBe(false);
		expect('headers' in stdio).toBe(false);
		expect('command' in stdio).toBe(true);
		if (!('command' in stdio)) throw new Error('expected stdio command');
		expect(stdio.command).toBe('node');
		const roundTrip = changeMcpTransport(stdio, 'streamable-http');
		expect(roundTrip.transport).toBe('streamable-http');
		expect('url' in roundTrip).toBe(true);
		if (!('url' in roundTrip)) throw new Error('expected HTTP URL');
		expect(roundTrip.url).toBe('https://example.com/mcp');
		expect('command' in roundTrip).toBe(false);
	});
});
