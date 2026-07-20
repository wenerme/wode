import { getHttpStatusText } from '../fetch/HttpStatus';

export interface ErrorDetailInit {
	message?: string;
	status: number;
	description?: string;
	code?: number | string;
	metadata?: Record<string, any>;
	cause?: any;
}

export class DetailError extends Error {
	readonly detail: ErrorDetail;
	readonly status: number;
	readonly description?: string;
	constructor(detail: ErrorDetail) {
		super(detail.message);
		this.cause = detail.cause;
		this.detail = detail;
		this.status = detail.status;
		this.description = detail.description;
	}

	toJSON() {
		return {
			code: this.detail.code,
			message: this.message,
			status: this.status,
			description: this.description,
			cause: this.cause,
		};
	}
}

export class DetailHolder implements ErrorDetail {
	readonly message: string;
	readonly status: number;
	readonly code: number | string;
	readonly metadata?: Record<string, any>;
	readonly description?: string;
	readonly cause?: any;

	constructor({
		status,
		message = getHttpStatusText(status),
		code = status,
		metadata,
		description,
		cause,
	}: ErrorDetailInit) {
		this.message = message ?? String(status);
		this.status = status;
		this.code = code;
		this.description = description;
		this.metadata = metadata;
		this.cause = cause;
	}

	with(o?: Partial<ErrorDetailInit> | string): DetailHolder {
		if (typeof o === 'string') {
			o = { message: o };
		}

		if (o === undefined) {
			return new DetailHolder(this);
		}

		return new DetailHolder({
			status: this.status,
			code: this.code,
			message: this.message,
			metadata: this.metadata,
			cause: this.cause,
			...o,
		});
	}

	asError(o?: Partial<ErrorDetailInit> | string): Error {
		if (typeof o === 'string') {
			o = { message: o };
		}

		return new DetailError(this.with(o));
	}

	require(v: any, o?: Partial<ErrorDetailInit> | string): any {
		if (v === undefined || v === null) {
			throw this.asError(o);
		}

		return v;
	}

	check(cond: any, o?: Partial<ErrorDetailInit> | string) {
		switch (cond) {
			case false:
			case undefined:
			case null: {
				throw this.asError(o);
			}
		}
	}

	throw(o?: string | Partial<ErrorDetailInit>): never {
		throw this.asError(o);
	}

	toJSON() {
		return {
			code: this.code,
			message: this.message,
			status: this.status,
			description: this.description,
			cause: this.cause,
			metadata: this.metadata,
		};
	}

	asResponse(): Response {
		return new Response(JSON.stringify(this.toJSON()), {
			status: this.status,
			statusText: this.description,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}

export interface ErrorDetail {
	readonly message: string;
	readonly status: number;
	readonly code?: number | string;
	readonly metadata?: Record<string, any>;
	readonly description?: string;
	readonly cause?: any;

	with(message: string): ErrorDetail;

	with(o?: Partial<ErrorDetailInit>): ErrorDetail;

	asError(o?: string | Partial<ErrorDetailInit>): Error;

	asResponse(): Response;

	throw(o?: string | Partial<ErrorDetailInit>): never;

	require<T>(v: T | undefined, o?: Partial<ErrorDetailInit> | string): NonNullable<T>;

	check(condition: boolean, o?: Partial<ErrorDetailInit> | string): asserts condition;

	check<T>(v: T | undefined | null, o?: Partial<ErrorDetailInit> | string): asserts v is NonNullable<T>;
}
