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

export type {
	IS3Service,
	S3DeleteObjectInput,
	S3GetObjectInput,
	S3ListObjectInput,
	S3PutObjectInput,
	S3PutObjectResult,
} from './IS3Service';
export { sanitizeS3Output } from './sanitize';
export * from './operations';
export { S3ServiceCapability } from './IS3Service';

const envName = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u);

export const S3ServiceOptionsSchema = Object.assign(
	z.strictObject({
		url: z.string().min(1),
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
		const client = new S3mini({
			accessKeyId,
			secretAccessKey,
			endpoint: endpointUrl,
			region: parsed.region,
			fetch: context.fetch,
		});

		const readOnly = context.config.readOnly !== false;
		const writable = () => {
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
				options?.signal?.throwIfAborted();
				return client.listObjects(input.delimiter ?? '/', input.prefix ?? '', input.maxKeys);
			},
			async getObject(input: S3GetObjectInput, options) {
				options?.signal?.throwIfAborted();
				// Note: s3mini's getObjectArrayBuffer does not accept an AbortSignal; the signal is only
				// checked before the call, not threaded through the underlying fetch.
				const data = await client.getObjectArrayBuffer(input.key);
				return data ? new TextDecoder().decode(data) : null;
			},
			async putObject(input: S3PutObjectInput, options): Promise<S3PutObjectResult> {
				writable();
				options?.signal?.throwIfAborted();
				const response = await client.putObject(input.key, input.content, input.contentType);
				return {
					ok: response.ok,
					status: response.status,
					etag: response.headers.get('etag') ?? undefined,
				};
			},
			async deleteObject(input: S3DeleteObjectInput, options) {
				writable();
				options?.signal?.throwIfAborted();
				return client.deleteObject(input.key);
			},
			close() {
				return Promise.resolve();
			},
			[Symbol.asyncDispose]() {
				return this.close();
			},
		};

		return { s3: service };
	},
};
