import type {
	ModelDescriptor,
	ModelFilter,
	ModelRegistration,
	ModelRegistrationHandle,
	ModelSelector,
	RegisteredModel,
} from './types';

export interface IModelRegistry {
	register(model: ModelRegistration): ModelRegistrationHandle;
	list(filter?: ModelFilter): readonly ModelDescriptor[];
	resolve(selector?: string | ModelSelector): RegisteredModel | undefined;
	require(selector?: string | ModelSelector): RegisteredModel;
}
