import { describe, expect, it } from 'vitest';
import { ApolloConnectionConfigSchema } from './config';
import { createApolloService } from './createApolloService';
import { ApolloServiceErrorCodes } from './errors';
import { createApolloHttpError, describeApolloTransportError } from './http-error';

const config = ApolloConnectionConfigSchema.parse({
	readOnly: false,
	appId: 'SampleApp',
	operator: 'operator',
	config: { baseUrl: 'http://config.test' },
	admin: { baseUrl: 'http://portal.test' },
	portal: { baseUrl: 'http://portal.test' },
});

function fetchFailure(code: string): Error {
	return Object.assign(new TypeError('fetch failed'), { cause: Object.assign(new Error(code), { code }) });
}

describe('Apollo HTTP error diagnostics', () => {
	it('surfaces only the redacted Apollo exception name and message', async () => {
		const error = await createApolloHttpError(
			Response.json(
				{
					exception: 'com.ctrip.framework.apollo.common.exception.BadRequestException',
					message: 'invalid password=hunter2\nsecond line',
					error: 'raw-body-secret',
				},
				{ status: 400 },
			),
			'PUT',
			new URL('http://portal.test/apps/A/items?token=query-secret'),
		);
		expect(error.toInfo()).toEqual({
			status: 400,
			method: 'PUT',
			path: '/apps/A/items',
			exception: 'BadRequestException',
			detail: expect.stringMatching(/^invalid password=\S+ second line$/u),
		});
		expect(JSON.stringify(error.toInfo())).not.toMatch(/hunter2|raw-body-secret|query-secret/u);
	});

	it('explains sign-in redirects and ignores non-JSON bodies', async () => {
		const redirect = await createApolloHttpError(
			new Response('', { status: 302, headers: { Location: '/signin' } }),
			'GET',
			new URL('http://portal.test/apps'),
		);
		expect(redirect.detail).toMatch(/sign-in/u);
		const html = await createApolloHttpError(
			new Response('<html>secret</html>', { status: 502 }),
			'GET',
			new URL('http://p/x'),
		);
		expect(html.toInfo()).toEqual({ status: 502, method: 'GET', path: '/x' });
	});

	it('classifies transport failures and marks connect failures as not sent', () => {
		expect(describeApolloTransportError(fetchFailure('UND_ERR_CONNECT_TIMEOUT'))).toEqual({
			reason: 'network error (UND_ERR_CONNECT_TIMEOUT)',
			notSent: true,
		});
		expect(describeApolloTransportError(fetchFailure('ECONNRESET'))).toEqual({
			reason: 'network error (ECONNRESET)',
			notSent: false,
		});
		expect(describeApolloTransportError(new Error('password=secret'))).toBeUndefined();
	});

	it('maps HTTP and connect failures to definitive or unknown service outcomes', async () => {
		const responses: Array<() => Response | Promise<Response>> = [];
		const service = createApolloService(config, {
			fetch: (async () => {
				const next = responses.shift();
				if (!next) throw new Error('unexpected request');
				return next();
			}) as typeof fetch,
		});
		responses.push(() => Response.json({ message: 'no such app' }, { status: 404 }));
		await expect(service.getPortalNamespace()).rejects.toMatchObject({
			code: ApolloServiceErrorCodes.OperationFailed,
			message:
				'Apollo operation failed: HTTP 404 no such app (GET /apps/SampleApp/envs/DEV/clusters/default/namespaces/application)',
			http: { status: 404 },
		});
		responses.push(() => Promise.reject(fetchFailure('UND_ERR_CONNECT_TIMEOUT')));
		await expect(service.publishRelease()).rejects.toMatchObject({
			code: ApolloServiceErrorCodes.OperationFailed,
			state: 'not-sent',
			message: 'Apollo publish failed: network error (UND_ERR_CONNECT_TIMEOUT); the request was not sent',
		});
		responses.push(() => Response.json({ message: 'boom' }, { status: 500 }));
		await expect(service.publishRelease()).rejects.toMatchObject({
			code: ApolloServiceErrorCodes.PartialFailure,
			state: 'publish-outcome-unknown',
			message: expect.stringMatching(/^Apollo publish outcome is unknown: HTTP 500 boom/u),
		});
		responses.push(() => new Response('', { status: 302, headers: { Location: '/done' } }));
		await expect(service.publishRelease()).rejects.toMatchObject({
			code: ApolloServiceErrorCodes.PartialFailure,
			state: 'publish-outcome-unknown',
			message: expect.stringMatching(/^Apollo publish outcome is unknown: HTTP 302 unexpected redirect/u),
		});
		responses.push(() => new Response('', { status: 302, headers: { Location: '/signin' } }));
		await expect(service.publishRelease()).rejects.toMatchObject({
			code: ApolloServiceErrorCodes.Unauthorized,
			state: 'rejected',
		});
		responses.push(() => Response.json({ message: 'Unauthorized' }, { status: 401 }));
		await expect(service.publishRelease()).rejects.toMatchObject({
			code: ApolloServiceErrorCodes.Unauthorized,
			state: 'rejected',
			message: expect.stringMatching(/^Apollo publish rejected: HTTP 401/u),
		});
	});
});
