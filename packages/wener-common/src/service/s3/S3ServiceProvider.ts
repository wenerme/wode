import { formatS3Url, parseS3Url } from '@wener/common/s3';
import { S3mini } from 's3mini';
import { z } from 'zod';
import type { ServiceProviderDefinition } from '../registry';
import type { ServiceProviderContext } from '../runtime/types';
import type {
	IS3Service,
	S3DeleteObjectInput,
	S3GetObjectInput,
	S3ListObjectInput,
	S3PutObjectInput,
	S3PutObjectResult,
} from './IS3Service';
import { S3Operations } from './operations';
import { S3ServiceCapability } from './IS3Service';
import {
	S3ListObjectInputSchema, S3ListObjectOutputSchema, S3GetObjectInputSchema, S3GetObjectOutputSchema,
	S3PutObjectInputSchema, S3PutObjectOutputSchema, S3DeleteObjectInputSchema, S3DeleteObjectOutputSchema,
	type S3ServiceCallOptions,
} from './S3ServiceContract';
import { createS3RequestScope } from './request';

const envName = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u);
const MAX_S3_OBJECT_BYTES = 16 * 1024 * 1024;

function limitResponseBody(response: Response, maxBytes: number): Response {
	if (!response.body) return response;
	const contentLength = response.headers.get('content-length');
	if (contentLength !== null) {
		const length = Number(contentLength);
		if (Number.isSafeInteger(length) && length > maxBytes) {
			void response.body.cancel().catch(() => undefined);
			throw new Error('S3 object is too large');
		}
	}
	const reader = response.body.getReader();
	let total = 0;
	const body = new ReadableStream<Uint8Array>({
		async pull(controller) {
			try {
				const { done, value } = await reader.read();
				if (done) {
					controller.close();
					return;
				}
				if (total + value.byteLength > maxBytes) {
					await reader.cancel();
					controller.error(new Error('S3 object is too large'));
					return;
				}
				total += value.byteLength;
				controller.enqueue(value);
			} catch (error) {
				controller.error(error);
			}
		},
		async cancel(reason) {
			await reader.cancel(reason);
		},
	});
	return new Response(body, { headers: response.headers, status: response.status, statusText: response.statusText });
}

export const S3ServiceOptionsSchema = Object.assign(
	z.strictObject({
		url: z.string().min(1).refine((value) => {
			try {
				const url = new URL(value.replace(/^s3:\/\//u, 'https://'));
				return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
			} catch { return false; }
		}, 'S3 URL must be an endpoint without credentials'),
		accessKeyIdEnv: envName,
		secretAccessKeyEnv: envName,
		bucket: z.string().min(1).optional(),
		region: z.string().min(1).optional(),
		pathStyle: z.boolean().optional(),
	}),
	{
		jsonSchema: {
			type: 'object',
			properties: {
				url: { type: 'string' },
				accessKeyIdEnv: { type: 'string' },
				secretAccessKeyEnv: { type: 'string' },
				bucket: { type: 'string' },
				region: { type: 'string' },
				pathStyle: { type: 'boolean' },
			},
			required: ['url', 'accessKeyIdEnv', 'secretAccessKeyEnv'],
			additionalProperties: false,
		},
	},
);
const configOptions = S3ServiceOptionsSchema;

export const S3ServiceProvider: ServiceProviderDefinition<IS3Service> = {
	name: 's3',
	title: 'S3',
	description: 'List, read, write and delete objects in an S3-compatible bucket.',
	examples: [
		{ command: 'woctl s3 list --prefix uploads/', description: 'List objects under a prefix.' },
		{ command: 'woctl s3 get path/to/object.txt', description: 'Read an object as text.' },
	],
	aliases: ['s3mini'],
	provides: [S3ServiceCapability],
	optionsSchema: S3ServiceOptionsSchema,
	operations: S3Operations,
	create(context: ServiceProviderContext) {
		const parsedOptions = configOptions.safeParse(context.config.options ?? {});
		if (!parsedOptions.success) throw new Error('Invalid S3 service configuration');
		const value = parsedOptions.data;

		function credential(name: 'accessKeyId' | 'secretAccessKey'): string {
			const reference = name === 'accessKeyId' ? value.accessKeyIdEnv : value.secretAccessKeyEnv;
			const secret = context.getEnv?.(reference);
			if (secret === undefined || !secret.length) throw new Error('S3 credential environment variable is unavailable');
			return secret;
		}

		const accessKeyId = credential('accessKeyId');
		const secretAccessKey = credential('secretAccessKey');

		const parsed = parseS3Url({
			url: value.url,
			bucket: value.bucket,
			region: value.region,
			pathStyle: value.pathStyle,
			accessKeyId,
			secretAccessKey,
		});
		if (!parsed) throw new Error('S3 service requires a url');
		if (!parsed.bucket) throw new Error('S3 service requires a bucket');

		const endpointUrl = formatS3Url(parsed, { credentials: false, useParams: false });
		const clientOptions = {
			accessKeyId,
			secretAccessKey,
			endpoint: endpointUrl,
			region: parsed.region,
			fetch: context.fetch,
		};
		const client = new S3mini(clientOptions);
		const scope = createS3RequestScope();
		function request<T>(invoke: (client: S3mini) => Promise<T>, options?: S3ServiceCallOptions, maxResponseBytes?: number): Promise<T> {
			return scope.run(async (signal) => {
				// s3mini treats its method opts as query params; cancellation belongs in fetch.
				const callClient = new S3mini({ ...clientOptions, fetch: async (input, init) => {
					signal.throwIfAborted();
					const response = await context.fetch(input, { ...init, signal: init?.signal ? AbortSignal.any([signal, init.signal]) : signal });
					return maxResponseBytes === undefined ? response : limitResponseBody(response, maxResponseBytes);
				} });
				try { return await invoke(callClient); }
				catch {
					signal.throwIfAborted();
					// SDK/network errors can include signed headers and provider response bodies.
					throw new Error('S3 operation failed');
				}
			}, options);
		}

		const readOnly = context.config.readOnly !== false;
		const writable = () => {
			scope.assertOpen();
			if (!readOnly) return;
			throw new Error('S3 service is read-only');
		};

		const service: IS3Service = {
			type: 's3',
			readOnly,
			get endpoint() {
				return client.endpoint;
			},
			get region() {
				return client.region;
			},
			get bucketName() {
				return client.bucketName;
			},
			async listObject(input: S3ListObjectInput = {}, options) {
				const value = S3ListObjectInputSchema.parse(input);
				return request(async (client) => {
					const objects = await client.listObjects(value.delimiter ?? '/', value.prefix ?? '', value.maxKeys);
					return S3ListObjectOutputSchema.parse(objects?.map((object) => ({
						...object, LastModified: object.LastModified.toJSON(),
					})) ?? null);
				}, options);
			},
			async getObject(input: S3GetObjectInput, options) {
				const value = S3GetObjectInputSchema.parse(input);
				return request(async (client) => {
					const data = await client.getObjectArrayBuffer(value.key);
					return S3GetObjectOutputSchema.parse(data === null ? null : new TextDecoder().decode(data));
				}, options, MAX_S3_OBJECT_BYTES);
			},
			async putObject(input: S3PutObjectInput, options): Promise<S3PutObjectResult> {
				writable();
				const value = S3PutObjectInputSchema.parse(input);
				return request(async (client) => {
					const response = await client.putObject(value.key, value.content, value.contentType);
					return S3PutObjectOutputSchema.parse({
						ok: response.ok, status: response.status, etag: response.headers.get('etag') ?? undefined,
					});
				}, options);
			},
			async deleteObject(input: S3DeleteObjectInput, options) {
				writable();
				const value = S3DeleteObjectInputSchema.parse(input);
				return request(async (client) => S3DeleteObjectOutputSchema.parse(await client.deleteObject(value.key)), options);
			},
			close() {
				return scope.close();
			},
			[Symbol.asyncDispose]() {
				return this.close();
			},
		};

		return { s3: service };
	},
};
