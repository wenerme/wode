import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge, twMerge } from 'tailwind-merge';

let _twMerge: typeof twMerge | undefined;
let _clsx: ClassNameMerger = (...inputs) => {
  if (!_twMerge) {
    const size = ['xs', 'sm', 'md', 'lg'];
    const intent = ['neutral', 'primary', 'secondary', 'accent'];
    const severity = ['info', 'success', 'warning', 'error'];
    const variant = ['ghost', 'outline', 'link'];
    const components = {
      btn: { size, intent, severity, variant },
      badge: { size, intent, severity, variant },
      link: { intent, severity },
      step: { intent, severity },
      tabs: { size, variant: ['boxed', 'bordered', 'lifted'] },
      menu: { size },
      alert: { severity },
      kbd: { size },
      table: { size },
      'btm-nav': { size },
      loading: {
        size,
        variant: ['spinner', 'dots', 'ring', 'ball', 'bars', 'infinity'],
      },
      progress: {
        intent,
        severity,
      },
      tooltip: {
        intent,
        severity,
      },
      rating: { size },
      divider: { intent, severity },
      ...['checkbox', 'file-input', 'radio', 'range', 'select', 'input', 'textarea', 'toggle'].reduce(
        (o, v) => {
          o[v] = {
            size,
            intent,
            severity,
          };
          return o;
        },
        {} as Record<string, any>,
      ),
    };

    const classGroups: Record<string, string[]> = {};
    for (const [name, values] of Object.entries(components)) {
      for (const [key, value] of Object.entries(values)) {
        classGroups[`${name}-${key}`] = value.map((v) => `${name}-${v}`);
      }
    }
    _twMerge = extendTailwindMerge<any>({
      extend: {
        classGroups,
      },
    });
  }
  return _twMerge(clsx(inputs));
};

type ClassNameMerger = (...inputs: ClassValue[]) => string;

export function cn(...inputs: ClassValue[]) {
  return _clsx(...inputs);
}

export function setClassNameMerger(merger: ClassNameMerger) {
  _clsx = merger;
}
