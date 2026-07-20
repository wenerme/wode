import { DetailError, DetailHolder, type ErrorDetail, type ErrorDetailInit } from './DetailError';

/*
https://github.com/tc39/proposal-error-cause
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause
Stage 3
Chrome 93, Safari 15, Node 16.9

https://www.npmjs.com/package/pony-cause
   */
export namespace Errors {
	export const BadRequest: ErrorDetail = create({ status: 400 });
	export const Unauthorized: ErrorDetail = create({ status: 403 });
	export const Forbidden: ErrorDetail = create({ status: 403 });
	export const NotFound: ErrorDetail = create({ status: 404 });
	export const InternalServerError: ErrorDetail = create({ status: 500 });
	export const NotImplemented: ErrorDetail = create({ status: 501 });
	export const BadGateway = create({ status: 502, message: 'Bad Gateway' });
	export const ServiceUnavailable: ErrorDetail = create({ status: 503 });

	export const IllegalState = create({ status: 500, message: 'Illegal State' });
	export const UnsupportedOperation = create({ status: 500, message: 'Unsupported Operation' });
	export const IllegalArgument = create({ status: 400, message: 'Illegal Argument' });
	export const InvalidType = create({ status: 400, message: 'Invalid Type' });

	// known errors
	// TypeError  when an operation could not be performed, typically (but not exclusively) when a value is not of the expected type.
	// RangeError  when a number is not within the correct range allowed.
	// AggregateError  when multiple errors need to be reported by an operation, for example by Promise.all().
	//  例如 Promise.any() 会返回一个 AggregateError，其中包含所有 rejected 的 Promise 的错误。
	// EvalError  when an error occurs during the evaluation of JavaScript code.
	// ReferenceError  when a non-existent variable is referenced.
	// SyntaxError  when a syntax error occurs while parsing code in eval().
	// URIError  when encodeURI() or decodeURI() are passed invalid parameters.
	// InternalError  when an internal error in the JavaScript engine is thrown. E.g. "too much recursion".
	// DOMException  when an error occurs in the DOM.

	export const resolvers: ((e: any) => ErrorDetail | undefined)[] = [];

	export function create(init: ErrorDetailInit): ErrorDetail {
		return new DetailHolder(init);
	}

	export function ok(res: Response, o?: Partial<ErrorDetailInit>) {
		if (res.ok) {
			return res;
		}
		throw create({
			description: res.statusText,
			status: res.status,
			...o,
			metadata: { ...o?.metadata, response: res },
		}).asError();
	}

	export function resolve(e: any): ErrorDetail {
		if (e instanceof DetailHolder) {
			return e;
		}

		if (e instanceof DetailError) {
			return e.detail;
		}

		for (const resolver of resolvers) {
			const r = resolver(e);
			if (r) {
				return r;
			}
		}

		if (isError(e)) {
			const { message, code, status } = e as any;
			// can get status from NestJS HttpException
			return new DetailHolder({ message, status: parseInt(status, 10) || 500, code, cause: e });
		}

		return new DetailHolder({ message: e.message, status: 500, cause: e });
	}

	/**
	 * Check if the given value is an Error
	 * @see https://github.com/tc39/proposal-is-error
	 */
	export function isError(e: any): e is Error {
		if ('isError' in Error) {
			// will handle cross-realm
			return (Error as any).isError(e);
		}
		return e instanceof Error;
	}

	export function isAbort(e: any): e is Error {
		if (!isError(e)) {
			return false;
		}
		return e.name === 'AbortError';
	}

	export function isTimeout(e: any): e is Error {
		if (!isError(e)) {
			return false;
		}
		return e.name === 'TimeoutError' || e.name === 'Timeout';
	}
}
