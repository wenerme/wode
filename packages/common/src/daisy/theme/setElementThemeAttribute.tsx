export function setElementThemeAttribute(
  theme: string | undefined,
  el = typeof document === 'undefined' ? undefined : document.documentElement,
) {
  if (!theme || !el) {
    return;
  }
  el.setAttribute('data-theme', theme);
}
