import type { ModelCapability, ModelInput, ModelOptions, ModelOutput } from './types';

export interface IModelService {
	readonly capabilities: readonly ModelCapability[];
	generateContent(
		input: ModelInput<'message-generation'>,
		options?: ModelOptions<'message-generation'>,
	): Promise<ModelOutput<'message-generation'>>;
	streamContent(
		input: ModelInput<'message-streaming'>,
		options?: ModelOptions<'message-streaming'>,
	): ModelOutput<'message-streaming'>;
	embedding(input: ModelInput<'embedding'>, options?: ModelOptions<'embedding'>): Promise<ModelOutput<'embedding'>>;
	rerank(input: ModelInput<'rerank'>, options?: ModelOptions<'rerank'>): Promise<ModelOutput<'rerank'>>;
	generateImage(
		input: ModelInput<'image-generation'>,
		options?: ModelOptions<'image-generation'>,
	): Promise<ModelOutput<'image-generation'>>;
	imageEdit(input: ModelInput<'image-edit'>, options?: ModelOptions<'image-edit'>): Promise<ModelOutput<'image-edit'>>;
	decide(input: ModelInput<'decision'>, options?: ModelOptions<'decision'>): Promise<ModelOutput<'decision'>>;
	countTokens(
		input: ModelInput<'token-count'>,
		options?: ModelOptions<'token-count'>,
	): Promise<ModelOutput<'token-count'>>;
	invoke<C extends ModelCapability>(
		capability: C,
		input: ModelInput<C>,
		options?: ModelOptions<C>,
	): Promise<ModelOutput<C>>;
}
