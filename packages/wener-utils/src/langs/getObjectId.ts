import { getGlobalStates } from './getGlobalStates';

export function getObjectId(k: any): number {
  const state = getGlobalStates('ObjectId', () => {
    return {
      id: 1,
      map: new WeakMap(),
    };
  });

  const { map } = state;

  if (map.has(k)) {
    return map.get(k);
  }

  const id = state.id++;
  map.set(k, id);
  return id;
}
