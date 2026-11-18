import { defineServiceCapability } from '../registry/ServiceCapability';
import type { IS3ServiceContract, S3ServiceInputs, S3ServiceOutputs } from './S3ServiceContract';

export type S3ListObjectInput = S3ServiceInputs['listObject'];
export type S3GetObjectInput = S3ServiceInputs['getObject'];
export type S3PutObjectInput = S3ServiceInputs['putObject'];
export type S3DeleteObjectInput = S3ServiceInputs['deleteObject'];
export type S3PutObjectResult = S3ServiceOutputs['putObject'];

/**
 * S3-compatible object storage service, backed by s3mini.
 * Methods take a single input object plus call options, matching this repo's other new services
 * (the private repo's IS3Service uses positional parameters instead).
 */
export interface IS3Service extends AsyncDisposable, IS3ServiceContract {
	readonly type: 's3';
	readonly readOnly: boolean;
	readonly endpoint: URL;
	readonly region: string;
	readonly bucketName: string;
	close(): Promise<void>;
}

/** Capability key for `IS3Service`; `registry.load(S3ServiceCapability)` resolves to `IS3Service`. */
export const S3ServiceCapability = defineServiceCapability<IS3Service>('s3');
