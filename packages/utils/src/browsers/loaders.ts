function load(
  el: HTMLScriptElement | HTMLLinkElement,
  resolve: (v: any) => void,
  reject: (v: any) => void,
  options: { attributes: Record<string, string> } | undefined,
) {
  el.onload = resolve;
  el.onerror = (e) => {
    el.remove();
    reject(e);
  };
  const { attributes = {} } = options || {};
  Object.entries(attributes).forEach(([k, v]) => el.setAttribute(k, v));

  document.head.appendChild(el);
}

export function loadScripts(src: string, options?: { attributes: Record<string, string> }) {
  // todo quote ?
  if (document.querySelector(`script[src="${src}"]`)) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    load(el, resolve, reject, options);
  });
}

export function loadStyles(href: string, options?: { attributes: Record<string, string> }) {
  if (document.querySelector(`link[href="${href}"]`)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const el = document.createElement('link');
    el.rel = 'stylesheet';
    el.href = href;
    load(el, resolve, reject, options);
  });
}
