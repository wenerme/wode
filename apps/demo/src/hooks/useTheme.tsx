import create from 'zustand';

export const useTheme = create<{ theme: string; setTheme(s: string): void }>((set) => {
  if (typeof window !== 'undefined') {
    setTheme(getTheme());
  }
  return {
    theme: getTheme(),
    setTheme(theme: string) {
      setTheme(theme);
      set({ theme });
    },
  };
});

function getTheme() {
  if (typeof window === 'undefined') {
    return 'system';
  }
  return localStorage['theme'] || 'system';
}

function setTheme(v: string) {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage['theme'] = v;
  if (v === 'system') {
    v = getPrefersColorSchema();
  }
  document.querySelector('html')?.setAttribute('data-theme', v);
}

function getPrefersColorSchema() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function watchPrefersColorSchema(cb: (s: string) => void) {
  const listener = (event: MediaQueryListEvent) => {
    cb(event.matches ? 'dark' : 'light');
  };
  const target = window.matchMedia('(prefers-color-scheme: dark)');
  target.addEventListener('change', listener);
  return () => target.removeEventListener('change', listener);
}
