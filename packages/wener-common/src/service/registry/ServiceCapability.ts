/**
 * A capability key that carries its service interface at the type level.
 *
 * At runtime it is a plain string (used in `provides`, registry lookup and tool dispatch), so
 * there is no central capability table to maintain: each service declares its own token next to
 * its `IXyzService` interface, and `registry.load(token)` / operation `invoke` infer the interface
 * from the token. A bare string is still assignable, but then the service type is `unknown`.
 */
export type ServiceCapability<S = unknown> = string & { readonly '~service'?: S };

/** Declare a capability token for a service interface, e.g. `defineServiceCapability<IGrafanaService>('grafana')`. */
export function defineServiceCapability<S>(name: string): ServiceCapability<S> {
	return name as ServiceCapability<S>;
}

/** The service interface carried by a capability token. */
export type ServiceOfCapability<C> = C extends ServiceCapability<infer S> ? S : never;
