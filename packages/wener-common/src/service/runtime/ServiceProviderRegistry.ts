import type { ServiceProvider } from './types';

export class ServiceProviderRegistry {
	readonly #providers = new Map<string, ServiceProvider>();
	readonly #aliases = new Map<string, ServiceProvider>();
	constructor(providers: readonly ServiceProvider[] = []) {
		for (const provider of providers) this.register(provider);
	}
	register(provider: ServiceProvider): this {
		const names = [provider.name, ...(provider.aliases ?? [])];
		if (
			new Set(names).size !== names.length ||
			names.some((name) => this.#providers.has(name) || this.#aliases.has(name))
		)
			throw new Error('Duplicate service provider');
		this.#providers.set(provider.name, provider);
		for (const alias of provider.aliases ?? []) this.#aliases.set(alias, provider);
		return this;
	}
	get(name: string): ServiceProvider {
		const provider = this.#providers.get(name) ?? this.#aliases.get(name);
		if (!provider) throw new Error('Unknown service provider');
		return provider;
	}
	resolveName(name: string): string | undefined {
		return (this.#providers.get(name) ?? this.#aliases.get(name))?.name;
	}
	list(): string[] {
		return [...this.#providers.keys()];
	}
	listProviders(): ServiceProvider[] {
		return [...this.#providers.values()];
	}
}
