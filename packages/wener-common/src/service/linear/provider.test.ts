import { describe, expect, test, vi } from 'vitest';
import { LinearServiceProvider } from '../providers/linear';
import { ServiceRegistry, type ServiceProviderDefinition } from '../registry';
import { createServiceProviderAdapter } from '../runtime/createServiceProviderAdapter';
import { getServiceOptionsJsonSchema } from '../runtime/getServiceOptionsJsonSchema';
import { LinearMethodInputs, LinearMethodOutputs, LinearServiceContract, LinearTools } from './contract';
import { LinearServiceOptionsSchema } from './config';
import type { ILinearService } from './ILinearService';
import { adapter, comment, issue, pageInfo, viewer } from './linear.fixture';
import { LinearOperations } from './operations';

describe('Linear provider contract and operations', () => {
	test('all eleven contracts expose complete input/output JSON schemas and mutation annotations', () => {
		const names = ['getViewer', 'listTeam', 'listIssueState', 'listUser', 'listProject', 'listIssue', 'getIssue', 'createIssue', 'updateIssue', 'listComment', 'createComment'];
		for (const object of [LinearServiceContract.methods, LinearOperations, LinearTools, LinearMethodInputs, LinearMethodOutputs]) expect(Object.keys(object)).toEqual(names);
		for (const name of names as (keyof typeof LinearTools)[]) {
			expect(LinearServiceContract.methods[name].inputSchema).toHaveProperty('type', 'object');
			expect(LinearServiceContract.methods[name].outputSchema).toHaveProperty('type', 'object');
			expect(LinearTools[name].annotations?.readOnlyHint).toBe(!['createIssue', 'updateIssue', 'createComment'].includes(name));
		}
		expect(LinearServiceContract.methods.listIssue.inputSchema.properties).toHaveProperty('filter');
		expect(LinearServiceContract.methods.getIssue.outputSchema.properties).toHaveProperty('labels');
		expect(LinearServiceContract.methods.listProject.outputSchema.properties).toHaveProperty('pageInfo');
		expect(LinearTools.updateIssue.annotations?.destructiveHint).toBe(true);
	});
	test('schema discovery remains lazy and publishes sensitive options metadata', async () => {
		const getEnv = vi.fn(() => 'example-secret');
		const fetch = vi.fn<typeof globalThis.fetch>();
		const config = { provider: 'linear', readOnly: true, baseUrl: 'https://example.test/graphql', options: { apiKeyEnv: 'LINEAR_EXAMPLE_KEY' } };
		const definition = createServiceProviderAdapter(LinearServiceProvider);
		const client = await definition.create({ name: 'issues', config, context: { services: { issues: config } }, fetch, getEnv });
		expect((await client.getSchema()).tools).toEqual(LinearTools);
		expect(definition.contract).toEqual(LinearServiceContract);
		expect(getServiceOptionsJsonSchema(LinearServiceOptionsSchema)?.properties).toMatchObject({ apiKey: { 'x-sensitive': true }, accessToken: { 'x-sensitive': true } });
		expect(fetch).not.toHaveBeenCalled();
		expect(getEnv).not.toHaveBeenCalled();
		await client.close?.();
	});
	test.each(['unknown', 'input', 'cancelled', 'readOnly'])('rejects %s before secrets or network access', async (kind) => {
		const getEnv = vi.fn(() => 'example-secret');
		const fetch = vi.fn<typeof globalThis.fetch>();
		const config = { provider: 'linear', readOnly: true, baseUrl: 'https://example.test/graphql', options: { apiKeyEnv: 'LINEAR_EXAMPLE_KEY' } };
		const client = await createServiceProviderAdapter(LinearServiceProvider).create({ name: 'issues', config, context: { services: { issues: config } }, fetch, getEnv });
		const signal = kind === 'cancelled' ? AbortSignal.abort() : undefined;
		const method = kind === 'unknown' ? 'missing' : kind === 'readOnly' ? 'createIssue' : 'getIssue';
		const input = kind === 'input' ? { id: '' } : kind === 'readOnly' ? { teamId: 'team-id', title: 'Title' } : { id: 'DEMO-1' };
		await expect(client.call(method, input, { signal })).rejects.toThrow();
		expect(getEnv).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
		await client.close?.();
	});
	test('all registered operations invoke the typed capability and forward signal', async () => {
		const transport = adapter();
		const service: ILinearService = { ...transport, type: 'linear', readOnly: false };
		const definition: ServiceProviderDefinition<'linear'> = { ...LinearServiceProvider, create: () => ({ linear: service }) };
		const registry = new ServiceRegistry({ context: { services: { issues: { provider: 'linear', readOnly: false } } } });
		registry.register(definition);
		const options = { signal: new AbortController().signal };
		await LinearOperations.getViewer.execute(registry, 'issues', {}, options);
		expect(service.getViewer).toHaveBeenCalledExactlyOnceWith(options);
		for (const entry of [
			{ name: 'listTeam', input: {} }, { name: 'listIssueState', input: { teamId: 'team-id' } },
			{ name: 'listUser', input: {} }, { name: 'listProject', input: {} }, { name: 'listIssue', input: {} },
			{ name: 'getIssue', input: { id: 'DEMO-1' } }, { name: 'createIssue', input: { teamId: 'team-id', title: 'Title' } },
			{ name: 'updateIssue', input: { id: 'DEMO-1', title: 'Title' } },
			{ name: 'listComment', input: { issueId: 'DEMO-1' } }, { name: 'createComment', input: { issueId: 'DEMO-1', body: 'Body' } },
		] as const) {
			await LinearOperations[entry.name].execute(registry, 'issues', entry.input, options);
			expect(service[entry.name]).toHaveBeenCalledExactlyOnceWith(LinearMethodInputs[entry.name].parse(entry.input), options);
		}
		await registry.close();
		expect(service.close).toHaveBeenCalledOnce();
	});
	test('full GraphQL provider pipeline supports all eleven operations and lazy env lookup', async () => {
		const getEnv = vi.fn(() => 'example-secret');
		const fetch = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
			expect(url).toBe('https://example.test/graphql');
			expect(new Headers(init?.headers).get('authorization')).toBe('example-secret');
			return new Response(JSON.stringify({ data: {
				viewer, teams: { nodes: [], pageInfo }, team: { states: { nodes: [], pageInfo } },
				users: { nodes: [], pageInfo }, projects: { nodes: [], pageInfo }, issues: { nodes: [issue()], pageInfo },
				issue: { ...issue(), comments: { nodes: [comment], pageInfo } },
				issueCreate: { success: true, issue: issue() }, issueUpdate: { success: true, issue: issue() }, commentCreate: { success: true, comment },
			} }));
		});
		const config = { provider: 'linear', readOnly: false, baseUrl: 'https://example.test/graphql', options: { apiKeyEnv: 'LINEAR_EXAMPLE_KEY' } };
		const client = await createServiceProviderAdapter(LinearServiceProvider).create({ name: 'issues', config, context: { services: { issues: config } }, fetch, getEnv });
		expect(getEnv).not.toHaveBeenCalled();
		for (const [name, input] of Object.entries({ getViewer: {}, listTeam: {}, listIssueState: { teamId: 'team-id' }, listUser: {}, listProject: {}, listIssue: {}, getIssue: { id: 'DEMO-1' }, createIssue: { teamId: 'team-id', title: 'Title' }, updateIssue: { id: 'DEMO-1', title: 'Title' }, listComment: { issueId: 'DEMO-1' }, createComment: { issueId: 'DEMO-1', body: 'Body' } })) {
			const result = await client.call(name, input);
			expect(LinearMethodOutputs[name as keyof typeof LinearMethodOutputs].safeParse(result).success).toBe(true);
		}
		expect(fetch).toHaveBeenCalledTimes(11);
		expect(getEnv).toHaveBeenCalledExactlyOnceWith('LINEAR_EXAMPLE_KEY');
		await client.close?.();
	});
});
