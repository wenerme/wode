export function computeIfAbsent<K, V>(map: Map<K, V>, key: K, fn: () => V): V ;
export function computeIfAbsent<K extends string | symbol | number, V>(map: Record<K, V>, key: K, fn: () => V): V ;
export function computeIfAbsent<K, V>(map: any, key: K, fn: () => V): V {
  if (map instanceof Map) {
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
