export type AgentToolApprovalResponse = {
	approved: boolean;
	id: string;
	reason?: string;
};

export type AgentToolApprovalResponder = (response: AgentToolApprovalResponse) => Promise<void>;

export function createAgentToolApprovalResponder(options: {
	beforeRespond?: (response: AgentToolApprovalResponse) => void | PromiseLike<void>;
	onError: (error: unknown) => void;
	respond: (response: AgentToolApprovalResponse) => void | PromiseLike<void>;
}): AgentToolApprovalResponder {
	const completed = new Set<string>();
	const pending = new Map<string, Promise<void>>();
	return (response) => {
		if (completed.has(response.id)) return Promise.resolve();
		const current = pending.get(response.id);
		if (current) return current;
		const request = Promise.resolve()
			.then(() => options.beforeRespond?.(response))
			.then(() => options.respond(response))
			.then(() => {
				completed.add(response.id);
			})
			.catch((error: unknown) => {
				options.onError(error);
				throw error;
			})
			.finally(() => {
				pending.delete(response.id);
			});
		pending.set(response.id, request);
		return request;
	};
}
