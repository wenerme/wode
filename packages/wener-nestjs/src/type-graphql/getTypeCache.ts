import { getGlobalStates } from '@wener/utils';

export function getTypeCache() {
  return getGlobalStates('TypeGraphQLTypeCache', () => new Map<any, any>());
}
