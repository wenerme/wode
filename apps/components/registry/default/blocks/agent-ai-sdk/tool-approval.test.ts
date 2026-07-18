import { describe, expect, it, vi } from 'vite-plus/test';
import { toSafeAgentError } from './safe-error';
import { createAgentToolApprovalResponder } from './tool-approval';

describe('createAgentToolApprovalResponder', () => {
	it('forwards approve and deny responses and preserves the automatic continuation path', async () => {
		const continueRun = vi.fn();
		const respond = vi.fn(async (response: { approved: boolean; id: string }) => {
			if (response.approved) continueRun(response.id);
		});
		const report = vi.fn();
		const responder = createAgentToolApprovalResponder({ onError: report, respond });
		await responder({ approved: true, id: 'approval-a' });
		await responder({ approved: false, id: 'approval-b', reason: '用户拒绝' });
		expect(respond).toHaveBeenNthCalledWith(1, { approved: true, id: 'approval-a' });
		expect(respond).toHaveBeenNthCalledWith(2, { approved: false, id: 'approval-b', reason: '用户拒绝' });
		expect(continueRun).toHaveBeenCalledWith('approval-a');
		expect(report).not.toHaveBeenCalled();
	});

	it('deduplicates pending and completed clicks so a successful approval responds exactly once', async () => {
		let release: (() => void) | undefined;
		const respond = vi.fn(
			() =>
				new Promise<void>((resolve) => {
					release = resolve;
				}),
		);
		const responder = createAgentToolApprovalResponder({ onError: () => undefined, respond });
		const first = responder({ approved: true, id: 'approval-a' });
		const duplicate = responder({ approved: true, id: 'approval-a' });
		expect(duplicate).toBe(first);
		await Promise.resolve();
		await Promise.resolve();
		expect(respond).toHaveBeenCalledOnce();
		release?.();
		await Promise.all([first, duplicate]);
		await responder({ approved: true, id: 'approval-a' });
		expect(respond).toHaveBeenCalledOnce();
	});

	it('reports and rejects beforeRespond failures without calling the SDK', async () => {
		const failure = new Error('invalid transcript');
		const report = vi.fn();
		const respond = vi.fn();
		const responder = createAgentToolApprovalResponder({
			beforeRespond: () => {
				throw failure;
			},
			onError: report,
			respond,
		});
		await expect(responder({ approved: true, id: 'approval-before' })).rejects.toBe(failure);
		expect(report).toHaveBeenCalledOnce();
		expect(report).toHaveBeenCalledWith(failure);
		expect(respond).not.toHaveBeenCalled();
	});

	it('reports synchronous SDK failures and permits one successful retry', async () => {
		const failure = new Error('sync SDK failure');
		const report = vi.fn();
		const respond = vi.fn().mockImplementationOnce(() => {
			throw failure;
		});
		const responder = createAgentToolApprovalResponder({ onError: report, respond });
		const first = responder({ approved: true, id: 'approval-retry' });
		const duplicate = responder({ approved: true, id: 'approval-retry' });
		expect(duplicate).toBe(first);
		await expect(first).rejects.toBe(failure);
		await expect(duplicate).rejects.toBe(failure);
		expect(report).toHaveBeenCalledOnce();
		expect(respond).toHaveBeenCalledOnce();

		await responder({ approved: true, id: 'approval-retry' });
		await responder({ approved: true, id: 'approval-retry' });
		expect(respond).toHaveBeenCalledTimes(2);
	});

	it('redacts and reports asynchronous SDK failures while preserving rejection', async () => {
		const failure = new Error('approval-secret failed at https://example.com/private');
		const report = vi.fn();
		const responder = createAgentToolApprovalResponder({
			onError: (error) => report(toSafeAgentError(error, ['approval-secret'])),
			respond: async () => {
				throw failure;
			},
		});
		await expect(responder({ approved: true, id: 'approval-error' })).rejects.toBe(failure);
		expect(report).toHaveBeenCalledOnce();
		const error = report.mock.calls[0]?.[0] as Error;
		expect(error.message).toContain('[已隐藏]');
		expect(error.message).not.toMatch(/approval-secret|example\.com/iu);
	});
});
