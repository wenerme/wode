import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vite-plus/test';
import {
	AiConfigEditor,
	type AiConfigSchema,
	AiConfigSecretField,
	AiConfigStringListField,
	aiConfigFieldError,
	safeParseAiConfig,
	useAiConfigDraft,
	withAiConfigMapEntry,
	withoutAiConfigMapEntry,
} from './index';

type Sample = { id: string; enabled: boolean };
const schema: AiConfigSchema<Sample> = {
	safeParse(value) {
		if (
			typeof value === 'object' &&
			value !== null &&
			'id' in value &&
			typeof value.id === 'string' &&
			value.id.length > 0 &&
			'enabled' in value &&
			typeof value.enabled === 'boolean'
		)
			return { success: true, data: { id: value.id, enabled: value.enabled } };
		return { success: false, error: { issues: [{ path: ['id'], message: 'ID is required' }] } };
	},
};

function Harness({ value }: { value: Sample }) {
	const controller = useAiConfigDraft({
		value,
		fallbackValue: { id: 'fallback', enabled: true },
		schema,
		onChange: () => undefined,
	});
	return (
		<AiConfigEditor title='示例配置' controller={controller}>
			<output>{controller.draft.id}</output>
		</AiConfigEditor>
	);
}

describe('AiConfigEditor', () => {
	it('renders an explicit safe fallback for invalid runtime values', () => {
		const markup = renderToStaticMarkup(<Harness value={null as unknown as Sample} />);
		expect(markup).toContain('data-invalid="true"');
		expect(markup).toContain('外部配置无效');
		expect(markup).toContain('原始值未被修改');
		expect(markup).toContain('fallback');
	});

	it('keeps secret value controlled and concealed during SSR', () => {
		const markup = renderToStaticMarkup(
			<AiConfigSecretField label='API Key' value='placeholder-secret' onValueChange={() => undefined} />,
		);
		expect(markup).toContain('type="password"');
		expect(markup).toContain('value="placeholder-secret"');
		expect(markup).toContain('aria-label="显示密钥"');
		expect(markup).toContain('aria-label="清除密钥"');
	});

	it('renders a labeled string list without mutating its input', () => {
		const value = Object.freeze(['alpha', 'beta']);
		const markup = renderToStaticMarkup(
			<AiConfigStringListField label='标签' value={value} onChange={() => undefined} />,
		);
		expect(markup).toContain('alpha');
		expect(markup).toContain('beta');
		expect(value).toEqual(['alpha', 'beta']);
	});

	it('preserves prototype-like map keys as own data properties', () => {
		const source = JSON.parse('{"__proto__":"safe","constructor":"value"}') as Record<string, string>;
		const updated = withAiConfigMapEntry(source, '__proto__', 'updated');
		expect(Object.getPrototypeOf(updated)).toBeNull();
		expect(Object.hasOwn(updated, '__proto__')).toBe(true);
		expect(updated.__proto__).toBe('updated');
		const removed = withoutAiConfigMapEntry(updated, 'constructor');
		expect(Object.hasOwn(removed, 'constructor')).toBe(false);
		expect(removed.__proto__).toBe('updated');
	});

	it('extracts field errors and catches schema exceptions', () => {
		expect(aiConfigFieldError([{ path: 'connection.url', message: 'URL invalid' }], 'connection')).toBe('URL invalid');
		const throwing: AiConfigSchema<Sample> = {
			safeParse: vi.fn(() => {
				throw new Error('schema failed');
			}),
		};
		const result = safeParseAiConfig(throwing, { id: 'x', enabled: true });
		expect(result.success).toBe(false);
	});
});
