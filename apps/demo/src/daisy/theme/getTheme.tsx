export function getTheme(): string {
  if (typeof window === 'undefined') {
    return 'system';
  }
  return localStorage.theme || 'system';
}
