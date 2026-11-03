import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { CliServiceConfigSchema } from '../config';
import { ApolloToolInputs } from '../runtime/apollo-tools';
import { ApolloServiceOptionsSchema, ApolloServiceProvider } from './index';

const options = {
	appId: 'SampleApp',
	operator: 'operator',
	config: { baseUrl: 'https://config.example.test' },
	admin: { baseUrl: 'https://admin.example.test', auth: { type: 'token', token: 'fixture-token' } },
	portal: { baseUrl: 'https://portal.example.test' },
};

describe('Apollo service binding', () => {
	it('exposes generated endpoint options and all operation schemas without creating a client', () => {
		expect(ApolloServiceProvider.optionsSchema).toBe(ApolloServiceOptionsSchema);
		expect(ApolloServiceOptionsSchema.jsonSchema).toEqual(z.toJSONSchema(ApolloServiceOptionsSchema, { io: 'input' }));
		expect(Object.keys(ApolloServiceProvider.contract?.methods ?? {})).toEqual(Object.keys(ApolloToolInputs));
		expect(ApolloServiceProvider.contract?.methods.patchNamespaceDocument?.inputSchema).toEqual(
			z.toJSONSchema(ApolloToolInputs.patchNamespaceDocument, { io: 'input' }),
		);
	});

	it.each([undefined, true, false])('takes readOnly=%s from the host configuration', async (readOnly) => {
		const config = CliServiceConfigSchema.parse({
			type: 'apollo',
			options,
			...(readOnly === undefined ? {} : { readOnly }),
		});
		const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json({ id: 1 }));
		const { apollo } = await ApolloServiceProvider.create({ name: 'apollo', config, context: { services: {} }, fetch });
		expect(apollo.readOnly).toBe(readOnly !== false);
		if (readOnly === false) {
			await apollo.publishRelease({ title: 'test release' });
			expect(fetch).toHaveBeenCalledTimes(1);
			const [url, init] = fetch.mock.calls[0] ?? [];
			expect(String(url)).toBe(
				'https://admin.example.test/openapi/v1/envs/DEV/apps/SampleApp/clusters/default/namespaces/application/releases',
			);
			expect(init).toMatchObject({ method: 'POST', redirect: 'manual' });
			expect(new Headers(init?.headers).get('Authorization')).toBe('fixture-token');
		} else {
			await expect(apollo.publishRelease()).rejects.toThrow('Apollo service is read-only');
			expect(fetch).not.toHaveBeenCalled();
		}
		await apollo.close();
	});

	it('rejects an options-level write override before any HTTP request', () => {
		const config = CliServiceConfigSchema.parse({ type: 'apollo', options: { ...options, readOnly: false } });
		const fetch = vi.fn<typeof globalThis.fetch>();
		expect(() => ApolloServiceProvider.create({ name: 'apollo', config, context: { services: {} }, fetch })).toThrow(
			'Invalid Apollo service options',
		);
		expect(fetch).not.toHaveBeenCalled();
	});
});
