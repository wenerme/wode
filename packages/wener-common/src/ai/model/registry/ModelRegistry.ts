import type { IModelRegistry } from './IModelRegistry';
import {
	ModelCapabilities,
	type ModelDescriptor,
	type ModelFilter,
	type ModelRegistration,
	type ModelRegistrationHandle,
	type ModelSelector,
	type RegisteredModel,
} from './types';

function describe(model: RegisteredModel): ModelDescriptor {
	return Object.freeze({
		provider: model.provider,
		id: model.id,
		alias: model.alias,
		enabled: model.enabled,
		capabilities: model.capabilities,
	});
}

export class ModelRegistry implements IModelRegistry {
	readonly #models = new Map<string, RegisteredModel>();

	register(model: ModelRegistration): ModelRegistrationHandle {
		if (!model.provider || model.provider.includes('/') || !model.id || model.alias === '')
			throw new Error('Model registration requires a provider and model id');
		const key = `${model.provider}/${model.alias ?? model.id}`;
		if (this.#models.has(key)) throw new Error('Model is already registered');
		for (const capability of model.capabilities) {
			if (!ModelCapabilities.includes(capability) || !model.service.capabilities.includes(capability))
				throw new Error('Model service does not support the registered capability');
		}
		const entry: RegisteredModel = Object.freeze({
			provider: model.provider,
			id: model.id,
			alias: model.alias,
			enabled: model.enabled ?? true,
			capabilities: Object.freeze([...new Set(model.capabilities)]),
			service: model.service,
		});
		this.#models.set(key, entry);
		return {
			dispose: () => {
				if (this.#models.get(key) === entry) this.#models.delete(key);
			},
		};
	}

	list(filter: ModelFilter = {}): readonly ModelDescriptor[] {
		return [...this.#models.values()]
			.filter(
				(model) =>
					(filter.provider === undefined || model.provider === filter.provider) &&
					(filter.enabled === undefined || model.enabled === filter.enabled) &&
					(filter.capability === undefined || model.capabilities.includes(filter.capability)),
			)
			.map(describe);
	}

	resolve(selector: string | ModelSelector = {}): RegisteredModel | undefined {
		const query = typeof selector === 'string' ? { model: selector } : selector;
		const matches = [...this.#models.values()].filter(
			(model) =>
				model.enabled &&
				(query.provider === undefined || query.provider === model.provider) &&
				(query.capability === undefined || model.capabilities.includes(query.capability)) &&
				(query.model === undefined ||
					[
						model.id,
						model.alias,
						`${model.provider}/${model.id}`,
						`${model.provider}/${model.alias ?? model.id}`,
					].includes(query.model)),
		);
		if (matches.length > 1) throw new Error('Ambiguous model selection');
		return matches[0];
	}

	require(selector: string | ModelSelector = {}): RegisteredModel {
		const model = this.resolve(selector);
		if (!model) throw new Error('No enabled model matches the requested capability and selection');
		return model;
	}
}
