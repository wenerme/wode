export class OpenObserveClientError extends Error {
	readonly code: string;
	readonly status?: number;
	constructor(code: string, message: string, status?: number) {
		super(message);
		this.name = 'OpenObserveClientError';
		this.code = code;
		this.status = status;
	}
}
