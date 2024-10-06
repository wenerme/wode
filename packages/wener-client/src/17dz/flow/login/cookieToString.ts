export function cookieToString(cookie?: Array<{ name: string; value: string }>): string {
  return cookie?.map((v) => `${v.name}=${v.value}`).join('; ') || '';
}
