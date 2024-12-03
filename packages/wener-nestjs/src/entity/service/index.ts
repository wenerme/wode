export { EntityBaseService } from './EntityBaseService';
export { AutoEntityService } from './AutoEntityService';
export type * from './types';
export type * from './services';

// building blocks

export { applySearch, resolveEntitySearch, type ResolveEntitySearchOptions } from './applySearch';
export { resolveSearch } from './resolveSearch';

export { applyQueryFilter } from './applyQueryFilter';
export { applyListQuery } from './applyListQuery';
export { applyResolveQuery } from './applyResolveQuery';

export {
  /**
   * @deprecated
   */
  parseOrder,
  type OrderRule,
} from './parseOrder';
export { toKnexOrder } from './toKnexOrder';
/**
 * @deprecated
 */
export { normalizePagination } from './normalizePagination';
export { hasEntityFeature } from './hasEntityFeature';

export { BaseEntityService, type EntityServiceOptions } from './BaseEntityService';
export {
  resolveEntityContext,
  type ResolveEntityContextOptions,
  type ResolvedEntityContext,
} from './resolveEntityContext';
export * from './findAllEntity';
export * from './resolveEntity';
