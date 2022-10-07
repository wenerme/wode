function load(
  el: HTMLScriptElement | HTMLLinkElement,
  resolve: (v: any) => void,
  reject: (v: any) => void,
  options: { attributes: Record<string, string> } | undefined,
) {
  el.onload = () => resolve(el);
  el.onerror = (e) => {
    el.remove();
    reject(e);
  };
  const { attributes = {} } = options || {};
  Object.entries(attributes).forEach(([k, v]) => el.setAttribute(k, v));

  document.head.appendChild(el);
}

export function loadScripts(
  src: string[],
  options?: { attributes: Record<string, string> },
): Promise<HTMLScriptElement[]>;
export function loadScripts(src: string, options?: { attributes: Record<string, string> }): Promise<HTMLScriptElement>;

export function loadScripts(
  src: string | string[],
  options?: { attributes: Record<string, string> },
): Promise<HTMLScriptElement | HTMLScriptElement[]> {
  if (Array.isArray(src)) {
    return new Promise(async (resolve, reject) => {
      const all = [];
      try {
        for (const s of src) {
          all.push(await loadScripts(s));
        }
      } catch (e) {
        reject(e);
        return;
      }
      resolve(all);
    });
  }
  // todo quote ?
  const $ele = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement;
  if ($ele) {
    return Promise.resolve($ele);
  }
  return new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    load(el, resolve, reject, options);
  });
}

export function loadStyles(href: string, options?: { attributes: Record<string, string> }): Promise<HTMLLinkElement> {
  const $ele = document.querySelector(`link[href="${href}"]`) as HTMLLinkElement;
  if ($ele) {
    return Promise.resolve($ele);
  }

  return new Promise((resolve, reject) => {
    const el = document.createElement('link');
    el.rel = 'stylesheet';
    el.href = href;
    load(el, resolve, reject, options);
  });
}
