import type { ApolloConnectionConfig, ApolloEndpointRole } from './config';
import type {
	ApolloAppScopeInput,
	ApolloClusterScopeInput,
	ApolloCreateAppEnvInput,
	ApolloCreateAppInput,
	ApolloCreateClusterInput,
	ApolloCreateMissingNamespaceInput,
	ApolloCreateNamespaceInput,
	ApolloDeleteAppInput,
	ApolloDeleteClusterInput,
	ApolloDeleteItemInput,
	ApolloDeleteNamespaceInput,
	ApolloDiffNamespaceReleaseInput,
	ApolloDiffReleaseInput,
	ApolloGetItemInput,
	ApolloGetNamespaceInput,
	ApolloGetReleaseInput,
	ApolloListAppInput,
	ApolloListItemInput,
	ApolloListNamespaceInput,
	ApolloListPortalItemInput,
	ApolloListPortalReleaseInput,
	ApolloListReleaseInput,
	ApolloListSelfAppInput,
	ApolloNamespaceScopeInput,
	ApolloPatchNamespaceDocumentInput,
	ApolloPatchNamespaceItemInput,
	ApolloPublishNamespaceReleaseInput,
	ApolloPublishReleaseInput,
	ApolloReadConfigInput,
	ApolloRequestInput,
	ApolloRollbackReleaseInput,
	ApolloUpdateAppInput,
	ApolloUpsertItemInput,
	ApolloWriteNamespaceTextInput,
} from './schema';
import { defineServiceCapability } from '../../registry/ServiceCapability';

export type ApolloReadFormat = 'auto' | 'config' | 'json' | 'properties' | 'raw' | 'content' | 'data';

export interface ApolloHttpRequest {
	role: Exclude<ApolloEndpointRole, 'config'>;
	path: string;
	method?: string;
	query?: Record<string, unknown>;
	body?: unknown;
	headers?: Record<string, string>;
}

export type ApolloConfigReadRequest = ApolloReadConfigInput;

export interface IApolloService {
	readonly type: 'apollo';
	readonly readOnly: boolean;
	request<T = unknown>(input: ApolloRequestInput): Promise<T>;
	readConfig<T = unknown>(input?: ApolloConfigReadRequest): Promise<T>;
	getStatus(): Promise<unknown>;
	listPortalApp(): Promise<unknown>;
	listPortalOrganization(): Promise<unknown>;
	listPortalEnv(): Promise<unknown>;
	getPortalNavTree(input?: ApolloAppScopeInput): Promise<unknown>;
	listPortalNamespace(input?: ApolloClusterScopeInput): Promise<unknown>;
	getPortalNamespace(input?: ApolloNamespaceScopeInput): Promise<unknown>;
	listPortalItem(input?: ApolloListPortalItemInput): Promise<unknown>;
	listPortalRelease(input?: ApolloListPortalReleaseInput): Promise<unknown>;
	getPortalConfig(input?: ApolloNamespaceScopeInput): Promise<unknown>;
	listRelease(input?: ApolloListReleaseInput): Promise<unknown>;
	getRelease(input: ApolloGetReleaseInput): Promise<unknown>;
	diffRelease(input: ApolloDiffReleaseInput): Promise<unknown>;
	listApp(input?: ApolloListAppInput): Promise<unknown>;
	getApp(input?: ApolloAppScopeInput): Promise<unknown>;
	listSelfApp(input?: ApolloListSelfAppInput): Promise<unknown>;
	createApp(input: ApolloCreateAppInput): Promise<unknown>;
	createAppEnv(input: ApolloCreateAppEnvInput): Promise<unknown>;
	updateApp(input: ApolloUpdateAppInput): Promise<unknown>;
	deleteApp(input: ApolloDeleteAppInput): Promise<unknown>;
	listMissingAppEnv(input?: ApolloAppScopeInput): Promise<unknown>;
	getEnvCluster(input?: ApolloAppScopeInput): Promise<unknown>;
	getCluster(input?: ApolloClusterScopeInput): Promise<unknown>;
	createCluster(input: ApolloCreateClusterInput): Promise<unknown>;
	deleteCluster(input: ApolloDeleteClusterInput): Promise<unknown>;
	listNamespace(input?: ApolloListNamespaceInput): Promise<unknown>;
	getNamespace(input?: ApolloGetNamespaceInput): Promise<unknown>;
	getNamespaceLock(input?: ApolloNamespaceScopeInput): Promise<unknown>;
	createNamespace(input: ApolloCreateNamespaceInput): Promise<unknown>;
	deleteNamespace(input?: ApolloDeleteNamespaceInput): Promise<unknown>;
	listNamespaceUsage(input?: ApolloNamespaceScopeInput): Promise<unknown>;
	listMissingNamespace(input?: ApolloClusterScopeInput): Promise<unknown>;
	createMissingNamespace(input?: ApolloCreateMissingNamespaceInput): Promise<unknown>;
	listItem(input?: ApolloListItemInput): Promise<unknown>;
	getItem(input: ApolloGetItemInput): Promise<unknown>;
	upsertItem(input: ApolloUpsertItemInput): Promise<unknown>;
	deleteItem(input: ApolloDeleteItemInput): Promise<unknown>;
	getLatestRelease(input?: ApolloNamespaceScopeInput): Promise<unknown>;
	publishRelease(input?: ApolloPublishReleaseInput): Promise<unknown>;
	rollbackRelease(input: ApolloRollbackReleaseInput): Promise<unknown>;
	patchNamespaceItem(input: ApolloPatchNamespaceItemInput): Promise<unknown>;
	writeNamespaceText(input: ApolloWriteNamespaceTextInput): Promise<unknown>;
	/** Edit a YAML/JSON namespace by path (set/merge/delete), then write the re-serialized text and optionally publish. */
	patchNamespaceDocument(input: ApolloPatchNamespaceDocumentInput): Promise<unknown>;
	/** Pending working copy (draft) vs. the latest active release, via Portal GET only. */
	diffNamespaceRelease(input?: ApolloDiffNamespaceReleaseInput): Promise<unknown>;
	/** Publish the working copy via Portal WebAPI; `dryRun` returns the diff and release permission only. */
	publishNamespaceRelease(input?: ApolloPublishNamespaceReleaseInput): Promise<unknown>;
	close(): Promise<void>;
}

export interface ApolloAdapter {
	request<T = unknown>(input: ApolloHttpRequest): Promise<T>;
	readConfig<T = unknown>(input?: ApolloConfigReadRequest): Promise<T>;
	close(): Promise<void>;
}

export type ApolloAdapterFactory = (config: ApolloConnectionConfig) => ApolloAdapter;

/** Capability key for `IApolloService`; `registry.load(ApolloServiceCapability)` resolves to `IApolloService`. */
export const ApolloServiceCapability = defineServiceCapability<IApolloService>('apollo');
