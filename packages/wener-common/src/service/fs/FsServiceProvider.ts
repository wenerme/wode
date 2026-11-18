import { createWebDavClient, type WebDavAuth } from '@wener/client/webdav';
import { S3mini } from 's3mini';
import { z } from 'zod';
import { createWebDavFileSystem } from '../../fs/createWebDavFileSystem';
import { FileSystemError } from '../../fs/FileSystemError';
import type { IFileStat, IFileSystem } from '../../fs/IFileSystem';
import { createS3MiniFileSystem } from '../../fs/s3/createS3MiniFileSystem';
import type { ServiceProviderDefinition } from '../registry';
import type { LocalFileSystemFactory, ServiceProviderContext } from '../runtime/types';
import { decodeFsBase64, encodeFsBase64, FsInputError } from './encoding';
import {
	FS_MAX_CONTENT_BYTES,
	FsListInputSchema, FsListOutputSchema, FsPathInputSchema, FsStatOutputSchema, FsReadInputSchema, FsReadOutputSchema,
	FsWriteInputSchema, FsWriteOutputSchema, FsMkdirInputSchema, FsRmInputSchema, FsPathOutputSchema,
	FsTransferInputSchema, FsTransferOutputSchema,
	type FsServiceCallOptions,
} from './FsServiceContract';
import { FsServiceCapability, type IFsService } from './IFsService';
import { FsOperations } from './operations';
import { type FsUrlCredentials, FsUrlError, type ParsedFsUrl, parseFsUrl } from './parseFsUrl';
import { createFsRequestScope } from './request';

/** Host hook for local paths; wener-common stays browser safe and never imports node:fs. */
export type CreateLocalFileSystem = LocalFileSystemFactory;

export interface CreateFsServiceProviderOptions {
	createLocalFileSystem?: CreateLocalFileSystem;
}

const envName = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u);

export const FsServiceOptionsSchema = Object.assign(
	z.strictObject({
		/** `file:///abs`, bare path, `s3://host/bucket/prefix`, `webdav(s)://host/path` or `http(s)://host/path`. */
		url: z.string().min(1).refine((value) => {
			try {
				parseFsUrl(value);
				return true;
			} catch { return false; }
		}, 'Unsupported or invalid filesystem URL'),
		/** WebDAV Basic username, or S3 access key id. */
		usernameEnv: envName.optional(),
		/** WebDAV Basic password, or S3 secret access key. */
		passwordEnv: envName.optional(),
		/** WebDAV Bearer token. */
		tokenEnv: envName.optional(),
		/** S3 region (overrides `?region=`). */
		region: z.string().min(1).optional(),
	}).refine((value) => !(value.tokenEnv && (value.usernameEnv || value.passwordEnv)), 'Use either tokenEnv or usernameEnv/passwordEnv')
		.refine((value) => Boolean(value.usernameEnv) === Boolean(value.passwordEnv), 'usernameEnv and passwordEnv must be set together'),
	{
		jsonSchema: {
			type: 'object',
			properties: {
				url: { type: 'string' },
				usernameEnv: { type: 'string' },
				passwordEnv: { type: 'string' },
				tokenEnv: { type: 'string' },
				region: { type: 'string' },
			},
			required: ['url'],
			additionalProperties: false,
		},
	},
);
export type FsServiceOptions = z.infer<typeof FsServiceOptionsSchema>;

function toEntry(stat: IFileStat) {
	const etag = typeof stat.meta?.etag === 'string' ? stat.meta.etag : undefined;
	const contentType = typeof stat.meta?.mime === 'string' ? stat.meta.mime : undefined;
	return {
		path: stat.path,
		name: stat.name,
		kind: stat.kind,
		size: Number.isSafeInteger(stat.size) && stat.size >= 0 ? stat.size : 0,
		...(Number.isFinite(stat.mtime) && stat.mtime > 0 ? { mtime: new Date(Math.trunc(stat.mtime)).toISOString() } : {}),
		...(etag ? { etag } : {}),
		...(contentType ? { contentType } : {}),
	};
}

function failure(error: unknown, operation: string, signal: AbortSignal): never {
	signal.throwIfAborted();
	if (error instanceof FsInputError || error instanceof FsUrlError) throw error;
	// Backend messages may include SDK/transport details; only the stable code crosses this boundary.
	const code = error instanceof FileSystemError ? error.code : 'EIO';
	throw Object.assign(new Error(`Filesystem ${operation} failed: ${code}`), { code });
}

async function readBounded(fs: IFileSystem, path: string, maxBytes: number, signal: AbortSignal) {
	if (fs.createReadableStream) {
		// Request one extra byte to detect truncation; servers ignoring Range are still cut here.
		const reader = (fs.createReadableStream(path, { signal, range: { start: 0, end: maxBytes } }) as ReadableStream<Uint8Array>).getReader();
		const chunks: Uint8Array[] = [];
		let size = 0;
		let truncated = false;
		try {
			for (;;) {
				const { done, value } = await reader.read();
				if (done) break;
				if (size + value.byteLength > maxBytes) {
					chunks.push(value.subarray(0, maxBytes - size));
					size = maxBytes;
					truncated = true;
					break;
				}
				chunks.push(value);
				size += value.byteLength;
			}
		} finally {
			await reader.cancel().catch(() => undefined);
		}
		const data = new Uint8Array(size);
		let offset = 0;
		for (const chunk of chunks) {
			data.set(chunk, offset);
			offset += chunk.byteLength;
		}
		return { data, truncated };
	}
	try {
		const data = await fs.readFile(path, { signal, maxBytes: maxBytes + 1 });
		return data.byteLength > maxBytes ? { data: data.subarray(0, maxBytes), truncated: true } : { data, truncated: false };
	} catch (error) {
		if (!(error instanceof FileSystemError) || error.code !== 'ENOTSUP') throw error;
	}
	const stat = await fs.stat(path, { signal });
	if (stat.size > maxBytes) throw new FsInputError('File exceeds maxBytes and this backend cannot read partially');
	return { data: await fs.readFile(path, { signal }), truncated: false };
}

export function createFsServiceProvider(providerOptions: CreateFsServiceProviderOptions = {}): ServiceProviderDefinition<IFsService> {
	return {
		name: 'fs',
		title: 'Filesystem',
		description: 'List, read, write, move, copy and remove files on local, S3 or WebDAV storage selected by URL.',
		examples: [
			{ command: 'woctl fs list /docs', description: 'List a directory.' },
			{ command: 'woctl fs read /docs/readme.txt', description: 'Read a file as text.' },
		],
		aliases: ['file', 'webdav', 'dav'],
		provides: [FsServiceCapability],
		optionsSchema: FsServiceOptionsSchema,
		operations: FsOperations,
		create(context: ServiceProviderContext) {
			const parsedOptions = FsServiceOptionsSchema.safeParse(context.config.options ?? {});
			if (!parsedOptions.success) throw new Error('Invalid filesystem service configuration');
			const options = parsedOptions.data;
			const target: ParsedFsUrl = parseFsUrl(options.url);

			function secret(name: string): string {
				const value = context.getEnv?.(name);
				if (value === undefined || !value.length) throw new FsInputError('Filesystem credential environment variable is unavailable');
				return value;
			}
			function basic(inline?: FsUrlCredentials): FsUrlCredentials | undefined {
				if (options.usernameEnv && options.passwordEnv)
					return { username: secret(options.usernameEnv), password: secret(options.passwordEnv) };
				return inline;
			}

			async function build(): Promise<IFileSystem> {
				switch (target.kind) {
					case 'local': {
						// Host runtime port first; provider options remain for hosts without the port.
						const factory = context.createLocalFileSystem ?? providerOptions.createLocalFileSystem;
						if (!factory) throw new FsInputError('Local filesystem is not available in this host');
						return factory({ root: target.root });
					}
					case 'webdav': {
						let auth: WebDavAuth | undefined;
						if (options.tokenEnv) auth = { type: 'bearer', token: secret(options.tokenEnv) };
						else {
							const credentials = basic(target.credentials);
							if (credentials) auth = { type: 'basic', ...credentials };
						}
						const client = createWebDavClient({ url: target.url, auth, fetch: context.fetch });
						return createWebDavFileSystem({ client });
					}
					case 's3': {
						const credentials = basic(target.credentials);
						if (!credentials) throw new FsInputError('S3 filesystem requires credentials');
						const endpoint = `${target.endpoint}/${encodeURIComponent(target.bucket)}`;
						const config = {
							accessKeyId: credentials.username,
							secretAccessKey: credentials.password,
							endpoint,
							region: options.region ?? target.region ?? 'auto',
						};
						return createS3MiniFileSystem({
							// Credential-free URL; createS3MiniFileSystem otherwise falls back to process.env.S3_URL.
							url: endpoint,
							bucket: target.bucket,
							client: new S3mini({ ...config, fetch: context.fetch }),
							createReadClient: (signal) => new S3mini({
								...config,
								fetch: (input, init) => {
									signal.throwIfAborted();
									return context.fetch(input, { ...init, signal: init?.signal ? AbortSignal.any([signal, init.signal]) : signal });
								},
							}),
							prefix: target.prefix || undefined,
						});
					}
				}
			}

			// Credentials and backends are resolved on first call so schema discovery needs no secrets.
			let backend: Promise<IFileSystem> | undefined;
			const scope = createFsRequestScope();
			function request<T>(operation: string, invoke: (fs: IFileSystem, signal: AbortSignal) => Promise<T>, callOptions?: FsServiceCallOptions) {
				return scope.run(async (signal) => {
					try {
						backend ??= build();
						const fs = await backend.catch((error: unknown) => {
							backend = undefined;
							throw error;
						});
						return await invoke(fs, signal);
					} catch (error) {
						return failure(error, operation, signal);
					}
				}, callOptions);
			}

			const readOnly = context.config.readOnly !== false;
			const writable = () => {
				scope.assertOpen();
				if (readOnly) throw new Error('Filesystem service is read-only');
			};

			const service: IFsService = {
				type: 'fs',
				readOnly,
				kind: target.kind,
				async list(input = { path: '/', maxEntries: 1000 }, callOptions) {
					const { path, maxEntries, ...rest } = FsListInputSchema.parse(input);
					return request('list', async (fs, signal) => {
						const entries = await fs.readdir(path, { ...rest, maxEntries, signal });
						return FsListOutputSchema.parse(entries.map(toEntry));
					}, callOptions);
				},
				async stat(input, callOptions) {
					const { path } = FsPathInputSchema.parse(input);
					return request('stat', async (fs, signal) => {
						try {
							return FsStatOutputSchema.parse(toEntry(await fs.stat(path, { signal })));
						} catch (error) {
							if (error instanceof FileSystemError && error.code === 'ENOENT') return null;
							throw error;
						}
					}, callOptions);
				},
				async read(input, callOptions) {
					const value = FsReadInputSchema.parse(input);
					return request('read', async (fs, signal) => {
						const { data, truncated } = await readBounded(fs, value.path, value.maxBytes, signal);
						return FsReadOutputSchema.parse({
							path: value.path,
							encoding: value.encoding,
							content: value.encoding === 'base64' ? encodeFsBase64(data) : new TextDecoder().decode(data),
							size: data.byteLength,
							truncated,
						});
					}, callOptions);
				},
				async write(input, callOptions) {
					writable();
					const value = FsWriteInputSchema.parse(input);
					const bytes = value.encoding === 'base64' ? decodeFsBase64(value.content) : new TextEncoder().encode(value.content);
					if (bytes.byteLength > FS_MAX_CONTENT_BYTES) throw new FsInputError('Filesystem content is too large');
					return request('write', async (fs, signal) => {
						await fs.writeFile(value.path, bytes, { signal, overwrite: value.overwrite });
						return FsWriteOutputSchema.parse({ path: value.path, size: bytes.byteLength });
					}, callOptions);
				},
				async mkdir(input, callOptions) {
					writable();
					const value = FsMkdirInputSchema.parse(input);
					return request('mkdir', async (fs, signal) => {
						await fs.mkdir(value.path, { signal, recursive: value.recursive });
						return FsPathOutputSchema.parse({ path: value.path });
					}, callOptions);
				},
				async rm(input, callOptions) {
					writable();
					const value = FsRmInputSchema.parse(input);
					return request('rm', async (fs, signal) => {
						await fs.rm(value.path, { signal, recursive: value.recursive, force: value.force });
						return FsPathOutputSchema.parse({ path: value.path });
					}, callOptions);
				},
				async mv(input, callOptions) {
					writable();
					const value = FsTransferInputSchema.parse(input);
					return request('mv', async (fs, signal) => {
						await fs.rename(value.from, value.to, { signal, overwrite: value.overwrite });
						return FsTransferOutputSchema.parse({ from: value.from, to: value.to });
					}, callOptions);
				},
				async cp(input, callOptions) {
					writable();
					const value = FsTransferInputSchema.parse(input);
					return request('cp', async (fs, signal) => {
						await fs.copy(value.from, value.to, { signal, overwrite: value.overwrite });
						return FsTransferOutputSchema.parse({ from: value.from, to: value.to });
					}, callOptions);
				},
				close() {
					return scope.close();
				},
				[Symbol.asyncDispose]() {
					return this.close();
				},
			};
			return { fs: service };
		},
	};
}

/** Default provider without local filesystem support; hosts inject it via `createFsServiceProvider`. */
export const FsServiceProvider: ServiceProviderDefinition<IFsService> = createFsServiceProvider();
