import { defineServiceCapability } from '../registry/ServiceCapability';
import type { FsUrlKind } from './parseFsUrl';
import type { IFsServiceContract } from './FsServiceContract';

/** URL-configured filesystem service over local, S3 or WebDAV backends. */
export interface IFsService extends AsyncDisposable, IFsServiceContract {
	readonly type: 'fs';
	readonly readOnly: boolean;
	/** Backend kind; `unknown` for remote tool clients. */
	readonly kind: FsUrlKind | 'unknown';
	close(): Promise<void>;
}

export const FsServiceCapability = defineServiceCapability<IFsService>('fs');
