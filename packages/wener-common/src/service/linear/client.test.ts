import { describe, expect, test, vi } from 'vitest';
import type { ServiceRuntimeClient, ServiceTool } from '../runtime/types';
import { createLinearServiceToolClient, type LinearServiceClient } from './client';

const names = [
	'getViewer',
	'listTeam',
	'listIssueState',
	'listUser',
	'listProject',
	'listIssue',
	'getIssue',
	'createIssue',
	'updateIssue',
	'listComment',
	'createComment',
] as const;
function runtimeFixture() {
	const tools = Object.fromEntries(names.map((name) => [name, { inputSchema: { type: 'object' } }])) satisfies Record<
		string,
		ServiceTool
	>;
	return {
		getSchema: vi.fn<ServiceRuntimeClient['getSchema']>(async () => ({ tools })),
		call: vi.fn<ServiceRuntimeClient['call']>(async () => ({ result: true })),
		close: vi.fn(),
	};
}

describe('Linear typed tool client', () => {
	test('discovers once and forwards every input unchanged with per-call cancellation', async () => {
		const runtime = runtimeFixture();
		const signal = new AbortController().signal;
		const client = await createLinearServiceToolClient(runtime, 'example');
		const options = { signal };
		const cases: Array<[(typeof names)[number], object, (client: LinearServiceClient) => Promise<unknown>]> = [];
		const viewer = {};
		const team = { first: 7, after: 'cursor', includeArchived: true };
		const state = { teamId: 't', first: 3 };
		const user = { query: 'User' };
		const project = { teamId: 't', query: 'Project' };
		const issueList = { filter: { priority: { gt: 0 } }, updatedAfter: '2026-10-01T00:00:00Z' };
		const issue = { id: 'LIN-1' };
		const create = { teamId: 't', title: 'Title', description: 'Body', labelIds: ['a'] };
		const update = { id: 'LIN-1', assigneeId: null, projectId: null, dueDate: null };
		const comments = { issueId: 'LIN-1', first: 7, after: 'cursor' };
		const comment = { issueId: 'LIN-1', body: 'Comment' };
		cases.push(
			['getViewer', viewer, (client) => client.getViewer(viewer, options)],
			['listTeam', team, (client) => client.listTeam(team, options)],
			['listIssueState', state, (client) => client.listIssueState(state, options)],
			['listUser', user, (client) => client.listUser(user, options)],
			['listProject', project, (client) => client.listProject(project, options)],
			['listIssue', issueList, (client) => client.listIssue(issueList, options)],
			['getIssue', issue, (client) => client.getIssue(issue, options)],
			['createIssue', create, (client) => client.createIssue(create, options)],
			['updateIssue', update, (client) => client.updateIssue(update, options)],
			['listComment', comments, (client) => client.listComment(comments, options)],
			['createComment', comment, (client) => client.createComment(comment, options)],
		);
		for (const [toolName, input, invoke] of cases) {
			const result = { toolName };
			runtime.call.mockResolvedValueOnce(result);
			expect(await invoke(client)).toBe(result);
			expect(runtime.call).toHaveBeenLastCalledWith(
				{ params: { service: 'example' }, body: { toolName, input } },
				{ signal: expect.any(AbortSignal) },
			);
			expect(runtime.call.mock.calls.at(-1)?.[0].body.input).toBe(input);
			const forwarded = runtime.call.mock.calls.at(-1)?.[1]?.signal;
			expect(forwarded?.aborted).toBe(false);
		}
		expect(runtime.getSchema).toHaveBeenCalledExactlyOnceWith({ params: { service: 'example' } }, {});
		expect(runtime.call).toHaveBeenCalledTimes(11);
		expect(runtime.close).not.toHaveBeenCalled();
	});

	test('optional list inputs become empty tool objects', async () => {
		const runtime = runtimeFixture();
		const client = await createLinearServiceToolClient(runtime, 'example');
		await client.listTeam();
		await client.listUser();
		await client.listProject();
		await client.listIssue();
		expect(runtime.call.mock.calls.map(([request]) => request.body)).toEqual([
			{ toolName: 'listTeam', input: {} },
			{ toolName: 'listUser', input: {} },
			{ toolName: 'listProject', input: {} },
			{ toolName: 'listIssue', input: {} },
		]);
	});

	test('combines factory and request cancellation without managing registry lifecycle', async () => {
		for (const abortFactory of [true, false]) {
			const runtime = runtimeFixture();
			const factory = new AbortController();
			const request = new AbortController();
			const reason = new Error('Fixture cancellation');
			const client = await createLinearServiceToolClient(runtime, 'example', { signal: factory.signal });
			expect(runtime.getSchema).toHaveBeenCalledExactlyOnceWith(
				{ params: { service: 'example' } },
				{ signal: factory.signal },
			);
			runtime.call.mockImplementationOnce(async (_input, options) => {
				(abortFactory ? factory : request).abort(reason);
				expect(options?.signal?.aborted).toBe(true);
				return {};
			});
			await expect(client.getViewer({}, { signal: request.signal })).rejects.toBe(reason);
			expect(runtime.close).not.toHaveBeenCalled();
		}
	});

	test('already-aborted factory and request signals avoid discovery or calls', async () => {
		const runtime = runtimeFixture();
		const controller = new AbortController();
		const reason = new Error('Already cancelled');
		controller.abort(reason);
		await expect(createLinearServiceToolClient(runtime, 'example', { signal: controller.signal })).rejects.toBe(reason);
		expect(runtime.getSchema).not.toHaveBeenCalled();
		const client = await createLinearServiceToolClient(runtime, 'example');
		await expect(client.getIssue({ id: 'LIN-1' }, { signal: controller.signal })).rejects.toBe(reason);
		expect(runtime.call).not.toHaveBeenCalled();
	});

	test('schema and tool failures propagate and never close the runtime', async () => {
		const runtime = runtimeFixture();
		const failure = new Error('Fixture tool failure');
		runtime.getSchema.mockRejectedValueOnce(failure);
		await expect(createLinearServiceToolClient(runtime, 'example')).rejects.toBe(failure);
		const client = await createLinearServiceToolClient(runtime, 'example');
		runtime.call.mockRejectedValueOnce(failure);
		await expect(client.getViewer({})).rejects.toBe(failure);
		expect(runtime.close).not.toHaveBeenCalled();
	});

	test('missing remote operations fail through the shared bridge', async () => {
		const runtime = runtimeFixture();
		runtime.getSchema.mockResolvedValueOnce({ tools: {} });
		const client = await createLinearServiceToolClient(runtime, 'example');
		expect(() => client.getViewer({})).toThrow('Service operation unavailable');
		expect(runtime.call).not.toHaveBeenCalled();
	});
});
