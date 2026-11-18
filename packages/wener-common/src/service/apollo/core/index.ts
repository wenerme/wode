export * from './config';
export {
	type ApolloConfigChange,
	ApolloFormattingOnlyKey,
	diffApolloConfigurations,
	diffApolloValues,
	formatApolloConfigPath,
} from './config-diff';
export { type CreateApolloServiceOptions, createApolloService } from './createApolloService';
export {
	type ApolloDocumentChange,
	type ApolloDocumentEditInput,
	type ApolloDocumentEditResult,
	type ApolloDocumentFormat,
	editApolloDocument,
	isApolloDocumentFormat,
	parseApolloDocumentPath,
} from './document-edit';
export {
	type ApolloHttpErrorInfo,
	ApolloServiceError,
	type ApolloServiceErrorCode,
	ApolloServiceErrorCodes,
} from './errors';
export { type ApolloFetch, type CreateApolloHttpAdapterOptions, createApolloHttpAdapter } from './http-adapter';
export type {
	ApolloAdapter,
	ApolloAdapterFactory,
	ApolloConfigReadRequest,
	ApolloHttpRequest,
	ApolloReadFormat,
	IApolloService,
} from './interface';
export * from './redactor';
export * from './schema';
export { ApolloServiceCapability } from './interface';
