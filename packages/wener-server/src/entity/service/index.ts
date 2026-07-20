export { AutoEntityService } from './AutoEntityService';
export { EntityBaseService } from './EntityBaseService';
export type * from './services';
export type * from './types';

// building blocks

/**
 * @deprecated
 */
export { resolvePagination } from '@wener/common/data';
export { applyListQuery } from './applyListQuery';

export { applyQueryFilter } from './applyQueryFilter';
export { applyResolveQuery } from './applyResolveQuery';
export { applySearch, type ResolveEntitySearchOptions, resolveEntitySearch } from './applySearch';
export { BaseEntityService, type EntityServiceOptions } from './BaseEntityService';
export * from './findAllEntity';
export { hasEntityFeature } from './hasEntityFeature';
export {
	type OrderRule,
	/**
	 * @deprecated
	 */
	parseOrder,
} from './parseOrder';
export * from './resolveEntity';
export {
	type ResolvedEntityContext,
	type ResolveEntityContextOptions,
	resolveEntityContext,
} from './resolveEntityContext';
export { resolveSearch } from './resolveSearch';
export { toKnexOrder } from './toKnexOrder';
