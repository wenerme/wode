export class WechatBotApiError extends Error {
	readonly endpoint: string;
	readonly status: number;
	readonly code?: number;
	readonly payload?: unknown;

	constructor(
		message: string,
		options: {
			endpoint: string;
			status: number;
			code?: number;
			payload?: unknown;
		},
	) {
		super(message);
		this.name = 'WechatBotApiError';
		this.endpoint = options.endpoint;
		this.status = options.status;
		this.code = options.code;
		this.payload = options.payload;
	}
}

export function isWechatBotSessionExpiredError(error: unknown): boolean {
	if (!(error instanceof WechatBotApiError)) return false;
	return error.code === -14;
}
