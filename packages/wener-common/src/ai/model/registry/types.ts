import type {
	MessageGenerationOptions,
	MessageGenerationRequest,
	MessageGenerationResult,
} from '@wener/client/ai/message-generation';
import type { IModelService } from './IModelService';

export const ModelCapabilities = [
	'message-generation',
	'message-streaming',
	'embedding',
	'image-generation',
	'image-edit',
	'rerank',
	'decision',
	'token-count',
] as const;
export type ModelCapability = (typeof ModelCapabilities)[number];

/** A registered service already owns its model and protocol target. */
export type ModelContentRequest = Omit<MessageGenerationRequest, 'model' | 'target' | 'stream'>;
export type ModelContentResult = MessageGenerationResult;
export type MessageGenerationInput = ModelContentRequest;
export type MessageGenerationOutput = ModelContentResult;
export type ModelStreamPart =
	| { type: 'text-delta'; delta: string }
	| { type: 'finish'; result: MessageGenerationOutput };
export interface EmbeddingInput {
	input: string | readonly string[];
	dimensions?: number;
}
export interface EmbeddingOutput {
	embeddings: number[][];
	model?: string;
	usage?: { inputTokens: number };
}
export interface ImageGenerationInput {
	prompt: string;
	count?: number;
	width?: number;
	height?: number;
}
export interface ImageGenerationOutput {
	images: Array<{ url: string; mediaType?: string } | { data: Uint8Array; mediaType: string }>;
	model?: string;
}
export type ModelImage = ImageGenerationOutput['images'][number];
export interface ImageEditInput extends ImageGenerationInput {
	images: readonly ModelImage[];
	mask?: ModelImage;
}
export interface RerankInput {
	query: string;
	documents: readonly string[];
	topN?: number;
}
export interface RerankOutput {
	results: Array<{ index: number; score: number }>;
}
export interface DecisionInput {
	input: string;
	choices: readonly string[];
}
export interface DecisionOutput {
	decision: string;
	reason?: string;
	confidence?: number;
}
export interface TokenCountInput {
	messages: MessageGenerationInput['messages'];
	system?: string;
}
export interface TokenCountOutput {
	inputTokens: number;
}
export interface ModelInvocationOptions {
	signal?: AbortSignal;
}
export type ModelContentOptions = MessageGenerationOptions;
/** Every capability has its own request, result and invocation options. */
export interface ModelCapabilityMap {
	'message-generation': {
		input: MessageGenerationInput;
		output: MessageGenerationOutput;
		options: ModelContentOptions;
	};
	'message-streaming': {
		input: MessageGenerationInput;
		output: AsyncIterable<ModelStreamPart>;
		options: ModelContentOptions;
	};
	embedding: { input: EmbeddingInput; output: EmbeddingOutput; options: ModelInvocationOptions };
	'image-generation': { input: ImageGenerationInput; output: ImageGenerationOutput; options: ModelInvocationOptions };
	'image-edit': { input: ImageEditInput; output: ImageGenerationOutput; options: ModelInvocationOptions };
	rerank: { input: RerankInput; output: RerankOutput; options: ModelInvocationOptions };
	decision: { input: DecisionInput; output: DecisionOutput; options: ModelInvocationOptions };
	'token-count': { input: TokenCountInput; output: TokenCountOutput; options: ModelInvocationOptions };
}
export type ModelInput<C extends ModelCapability> = ModelCapabilityMap[C]['input'];
export type ModelOutput<C extends ModelCapability> = ModelCapabilityMap[C]['output'];
export type ModelOptions<C extends ModelCapability> = ModelCapabilityMap[C]['options'];
export type ModelHandler<C extends ModelCapability> = (
	input: ModelInput<C>,
	options: ModelOptions<C>,
) => ModelOutput<C> | Promise<ModelOutput<C>>;
export type ModelHandlers = { [C in ModelCapability]?: ModelHandler<C> };

export interface ModelDescriptor {
	readonly provider: string;
	readonly id: string;
	readonly alias?: string;
	readonly enabled: boolean;
	readonly capabilities: readonly ModelCapability[];
}
export interface ModelRegistration extends Omit<ModelDescriptor, 'enabled'> {
	readonly enabled?: boolean;
	readonly service: IModelService;
}
export interface RegisteredModel extends ModelDescriptor {
	readonly service: IModelService;
}
export interface ModelFilter {
	provider?: string;
	capability?: ModelCapability;
	enabled?: boolean;
}
export interface ModelSelector extends Omit<ModelFilter, 'enabled'> {
	/** Bare alias/id or provider-qualified alias/id. Resolution always excludes disabled entries. */
	model?: string;
}
export interface ModelRegistrationHandle {
	dispose(): void;
}
