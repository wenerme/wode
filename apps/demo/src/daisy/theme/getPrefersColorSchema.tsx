export function getPrefersColorSchema(): 'dark' | 'light' {
  if (typeof window === 'undefined') {
    return 'light';
  }
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
