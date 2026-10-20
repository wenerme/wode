import { describe, expect, it, vi } from 'vitest';
import { parseCliConfig, type ResolvedCliContext, resolveCliContext } from '../../context';
import { createServiceRuntime, ServiceProviderRegistry } from './createServiceRuntime';

function fixture(context: ResolvedCliContext) {
	const call = vi.fn(async () => ({ ok: true }));
	const getSchema = vi.fn(async () => ({
		tools: {
			read: { inputSchema: {}, annotations: { readOnlyHint: true } },
			write: { inputSchema: {} },
		},
	}));
	const create = vi.fn(() => ({ call, getSchema }));
	const runtime = createServiceRuntime({ context, providers: new ServiceProviderRegistry([{ name: 'test', create }]) });
	return { runtime, create, call, getSchema };
}

describe('runtime service availability', () => {
	it.each([{ disabled: true }, { enabled: false }, { enabled: false, disabled: true }])(
		'blocks disabled configured services before creating a provider',
		async (flags) => {
			const { runtime, create, call, getSchema } = fixture(
				resolveCliContext(parseCliConfig({ services: [{ name: 'demo', type: 'test', ...flags }] })),
			);
			await expect(runtime.getSchema({ params: { service: 'demo' } })).rejects.toThrow('Selected service is disabled');
			await expect(
				runtime.call({ params: { service: 'demo' }, body: { toolName: 'read', input: {} } }),
			).rejects.toThrow('disabled');
			expect(create).not.toHaveBeenCalled();
			expect(call).not.toHaveBeenCalled();
			expect(getSchema).not.toHaveBeenCalled();
			await runtime.close();
		},
	);

	it.each([{ disabled: true }, { enabled: false }, { enabled: true, disabled: true }])(
		'also guards a host-built context that bypassed the resolver',
		async (flags) => {
			const { runtime, create } = fixture({
				name: 'manual',
				defaults: {},
				services: { demo: { provider: 'test', readOnly: true, ...flags } },
			});
			await expect(runtime.getSchema({ params: { service: 'demo' } })).rejects.toThrow();
			await expect(
				runtime.call({ params: { service: 'demo' }, body: { toolName: 'read', input: {} } }),
			).rejects.toThrow();
			expect(create).not.toHaveBeenCalled();
			await runtime.close();
		},
	);

	it('does not allow an inconsistent active map to override a disabled configured entry', async () => {
		const { runtime, create } = fixture({
			name: 'manual',
			defaults: {},
			services: { demo: { provider: 'test', readOnly: true } },
			configuredServices: { demo: { provider: 'test', readOnly: true, disabled: true } },
		});
		await expect(runtime.getSchema({ params: { service: 'demo' } })).rejects.toThrow('disabled');
		expect(create).not.toHaveBeenCalled();
		await runtime.close();
	});

	it('leaves unknown types normalized and reports unsupported providers only at execution', async () => {
		const context = resolveCliContext(parseCliConfig({ services: [{ name: 'future', type: 'fixture-secret' }] }));
		expect(context.services.future.provider).toBe('fixture-secret');
		const { runtime, create } = fixture(context);
		await expect(runtime.getSchema({ params: { service: 'future' } })).rejects.toThrow(/^Unknown service provider$/);
		expect(create).not.toHaveBeenCalled();
		await runtime.close();
	});

	it('does not let unknown permission metadata change existing read-only policy', async () => {
		const { runtime, call } = fixture(
			resolveCliContext(
				parseCliConfig({
					services: [{ name: 'demo', type: 'test', permissions: { write: true }, writable: true }],
				}),
			),
		);
		await expect(runtime.call({ params: { service: 'demo' }, body: { toolName: 'write', input: {} } })).rejects.toThrow(
			'read-only',
		);
		expect(call).not.toHaveBeenCalled();
		await expect(runtime.call({ params: { service: 'demo' }, body: { toolName: 'read', input: {} } })).resolves.toEqual(
			{ ok: true },
		);
		await runtime.close();
	});
});
