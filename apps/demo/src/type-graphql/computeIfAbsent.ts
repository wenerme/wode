export function computeIfAbsent<K, V>(map: Map<K, V>, key: K, fn: () => V): V {
  if (!map.has(key)) {
    map.set(key, fn());
  }
  return map.get(key)!;
}
