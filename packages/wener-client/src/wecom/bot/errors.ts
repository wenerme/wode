export interface WecomBotClientErrorOptions {
	cmd?: string;
	reqId?: string;
	errcode?: number;
	payload?: unknown;
}

export class WecomBotClientError extends Error {
	readonly cmd?: string;
	readonly reqId?: string;
	readonly errcode?: number;
	readonly payload?: unknown;

	constructor(message: string, options: WecomBotClientErrorOptions = {}) {
		super(message);
		this.name = 'WecomBotClientError';
		this.cmd = options.cmd;
		this.reqId = options.reqId;
		this.errcode = options.errcode;
		this.payload = options.payload;
	}
}

