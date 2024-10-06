export function computeIfAbsent<K extends WeakKey, V>(map: WeakMap<K, V>, key: K, fn: () => V): V;
export function computeIfAbsent<K, V>(map: Map<K, V>, key: K, fn: () => V): V;
export function computeIfAbsent<K extends string | symbol | number, V>(map: Record<K, V>, key: K, fn: () => V): V;
export function computeIfAbsent(map: any, key: any, fn: () => any): any {
  if (map instanceof Map || map instanceof WeakMap) {
    if (!map.has(key)) {
      map.set(key, fn());
    }
    return map.get(key)!;
  }

  if (!map[key]) {
    map[key] = fn();
  }
  return map[key];
}
