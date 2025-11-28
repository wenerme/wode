import { Code, ConnectError, createConnectRouter } from '@connectrpc/connect';
import { Logger } from '@nestjs/common';
import { getContext } from '@wener/server';
import { Errors, type MaybePromise } from '@wener/utils';
import { serveNodeConnect, type ServeNodeConnectOptions } from './serveNodeConnect';
import type { ConnectRpcServiceDef } from './types';

function getConnectErrorCodeFromHttpStatus(status: number): Code {
	if (status >= 1 && status <= Code.Unauthenticated) {
		return Code[status] as any as Code;
	}
	switch (status) {
		case 400: // Bad Request
			return Code.InvalidArgument;
		case 401: // Unauthorized
			return Code.Unauthenticated;
		case 403: // Forbidden
			return Code.PermissionDenied;
		case 404: // Not Found
			return Code.NotFound;
		case 409: // Conflict
			return Code.Aborted;
		case 412: // Precondition Failed
			return Code.FailedPrecondition;
		case 429: // Too Many Requests
			return Code.ResourceExhausted;
		case 499: // Client Closed Request
			return Code.Canceled;
		case 500: // Internal Server Error
			return Code.Internal;
		case 501: // Not Implemented
			return Code.Unimplemented;
		case 503: // Service Unavailable
			return Code.Unavailable;
		case 504: // Gateway Timeout
			return Code.DeadlineExceeded;
	}
	return Code.Unknown;
}

export function createConnectHandler({
	log = new Logger(createConnectHandler.name),
	services,
	onRequest = ({ next, request }) => next(request),
	...options
}: {
	log?: Logger;
	services: ConnectRpcServiceDef[];
	onRequest?: (req: {
		service: any;
		method: string;
		request: any;
		next: (req: any) => Promise<any>;
	}) => MaybePromise<any>;
} & Pick<ServeNodeConnectOptions, 'prefix'>) {
	let router = createConnectRouter({
		interceptors: [
			(next) => {
				return async (req) => {
					try {
						return await next(req);
					} catch (e) {
						log.error(`-> ${req.service.name}.${req.method.name}`, req.message);
						console.error('RPC Error', e);
						if (e instanceof ConnectError) {
							throw e;
						}
						let detail = Errors.resolve(e);
						throw new ConnectError(detail.message, getConnectErrorCodeFromHttpStatus(detail.status), {}, [], e);
					}
				};
			},
		],
	});
	let handler = serveNodeConnect({
		router,
		// prefix: ['/', '/api/connect'],
		routes: (router) => {
			log.log(`Register ${services.length} services`);
			services.forEach(({ Schema, Impl, target }) => {
				log.log(`Register service ${Schema.typeName}`);
				target ||= getContext(Impl);
				router.service(
					Schema,
					new Proxy(target, {
						get(target, key, receiver) {
							let val = target[key];
							if (!val || typeof val !== 'function' || typeof key !== 'string') return val;
							const fn = val.bind(target);
							return (req: any) => {
								return onRequest({ service: target, method: key, request: req, next: fn });
							};
						},
					}),
				);
			});
		},
		...options,
	});

	return handler;
}
