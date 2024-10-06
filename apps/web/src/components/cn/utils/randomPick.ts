export function randomPick<T>(s: T[]) {
  return s[Math.floor(Math.random() * s.length)];
}
