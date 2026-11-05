import type { CliCommandDefinition, CliOption } from '@wener/common/cli';
import type { ServiceContract, ServiceTool } from '@wener/common/service';

export const WOCLI_CATALOG_SCHEMA_VERSION = 1 as const;

/** Static registration data, never a configured service or a native configuration schema. */
export interface CliCatalog {
	schemaVersion: typeof WOCLI_CATALOG_SCHEMA_VERSION;
	name: string;
	version: string;
	globalOptions: readonly CliOption[];
	commands: readonly CliCatalogCommand[];
	providers: readonly CliCatalogProvider[];
}

export interface CliCatalogAvailability {
	serviceProvider?: string;
	serviceCapability?: string;
	hostCapability?: string;
}

export type CliCatalogExample = { command: string; description?: string };

export interface CliCatalogCommand extends Omit<CliCommandDefinition, 'commands'> {
	/** Effective static requirements, including requirements inherited from ancestors. */
	availability?: CliCatalogAvailability;
	examples?: readonly CliCatalogExample[];
	commands?: readonly CliCatalogCommand[];
}

export interface CliCatalogProvider {
	name: string;
	aliases?: readonly string[];
	capabilities?: readonly string[];
	title?: string;
	description?: string;
	documentationUrl?: string;
	examples?: readonly CliCatalogExample[];
	/** The provider's optionsSchema.jsonSchema, without a parser or runtime instance. */
	optionsSchema?: Record<string, unknown>;
	contract?: ServiceContract;
	tools?: Readonly<Record<string, ServiceTool>>;
}

export type CliCatalogFormat = 'json' | 'md' | 'typescript' | 'jsonschema';

export interface RenderWocliCatalogOptions {
	format: CliCatalogFormat;
	serviceType?: string;
}
