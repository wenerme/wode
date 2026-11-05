import { defineServiceCapability } from '../registry/ServiceCapability';

export interface S3ListObjectInput {
	delimiter?: string;
	prefix?: string;
	maxKeys?: number;
}

export interface S3GetObjectInput {
	key: string;
}

export interface S3PutObjectInput {
	key: string;
	content: string;
	contentType?: string;
}

export interface S3DeleteObjectInput {
	key: string;
}

export interface S3PutObjectResult {
	ok: boolean;
	status: number;
	etag?: string;
}

/**
 * S3-compatible object storage service, backed by s3mini.
 * Methods take a single input object plus call options, matching this repo's other new services
 * (the private repo's IS3Service uses positional parameters instead).
 */
export interface IS3Service extends AsyncDisposable {
	readonly type: 's3';
	readonly readOnly: boolean;
	readonly endpoint: URL;
	readonly region: string;
	readonly bucketName: string;
	listObject(input?: S3ListObjectInput, options?: { signal?: AbortSignal }): Promise<unknown>;
	getObject(input: S3GetObjectInput, options?: { signal?: AbortSignal }): Promise<string | null>;
	putObject(input: S3PutObjectInput, options?: { signal?: AbortSignal }): Promise<S3PutObjectResult>;
	deleteObject(input: S3DeleteObjectInput, options?: { signal?: AbortSignal }): Promise<boolean>;
	close(): Promise<void>;
}

/** Capability key for `IS3Service`; `registry.load(S3ServiceCapability)` resolves to `IS3Service`. */
export const S3ServiceCapability = defineServiceCapability<IS3Service>('s3');
