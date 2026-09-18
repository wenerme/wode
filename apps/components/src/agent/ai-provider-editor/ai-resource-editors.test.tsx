import { ModelSchema, type Provider, ProviderSchema, ServiceSchema } from '@wener/ai/schema';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import { AiModelEditor } from '../ai-model-editor';
import { AiServiceEditor, parseServicePort } from '../ai-service-editor';
import { AiProviderEditor } from './ai-provider-editor';

describe('canonical AI resource editors', () => {
	it('renders provider connection, registry API choices, secret, routing, and metadata fields', () => {
		const provider = ProviderSchema.parse({
			id: 'provider-example',
			name: 'example',
			baseUrl: 'https://api.example.com/v1',
			apiKey: 'placeholder-secret',
			endpoints: ['endpoint-example'],
			enabled: true,
		});
		const markup = renderToStaticMarkup(<AiProviderEditor value={provider} onChange={() => undefined} />);
		expect(markup).toContain('AI Provider 配置');
		expect(markup).toContain('openai-chat-completions');
		expect(markup).toContain('type="password"');
		expect(markup).toContain('placeholder-secret');
		expect(markup).toContain('Endpoint 引用');
		expect(markup).toContain('凭据扩展');
	});

	it('fails visibly for invalid external provider values', () => {
		const markup = renderToStaticMarkup(
			<AiProviderEditor value={{ id: '', name: '' } as Provider} onChange={() => undefined} />,
		);
		expect(markup).toContain('外部配置无效');
		expect(markup).toContain('provider-new');
	});

	it('renders injected provider and endpoint references for models', () => {
		const model = ModelSchema.parse({
			id: 'model-example',
			name: 'example-model',
			providerId: 'provider-example',
			endpointId: 'endpoint-example',
			type: 'chat',
			enabled: true,
		});
		const markup = renderToStaticMarkup(
			<AiModelEditor
				value={model}
				providerOptions={[{ value: 'provider-example', label: 'Example Provider' }]}
				endpointOptions={[{ value: 'endpoint-example', label: 'Example Endpoint' }]}
				onChange={() => undefined}
			/>,
		);
		expect(markup).toContain('Example Provider');
		expect(markup).toContain('Example Endpoint');
		expect(markup).toContain('输入模态');
		expect(markup).toContain('结构化输出');
		expect(markup).toContain('默认推理参数');
	});

	it('renders service endpoint, string or numeric ports, plaintext credential, capabilities, and options fields', () => {
		const service = ServiceSchema.parse({
			id: 'service-example',
			name: 'example-service',
			type: 'ai',
			baseUrl: 'https://service.example.com',
			username: 'demo',
			password: 'placeholder-password',
			port: 'http-alt',
			enabled: true,
		});
		const markup = renderToStaticMarkup(<AiServiceEditor value={service} onChange={() => undefined} />);
		expect(markup).toContain('AI Service 配置');
		expect(markup).toContain('Endpoint 连接');
		expect(markup).toContain('placeholder-password');
		expect(markup).toContain('value="http-alt"');
		expect(parseServicePort('8080')).toBe(8080);
		expect(parseServicePort('http-alt')).toBe('http-alt');
		expect(markup).toContain('能力');
		expect(markup).toContain('Options');
	});
});
