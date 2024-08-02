import { lazyRoute } from '@wener/console/router';

export function loadRoute(id: string) {
  return lazyRoute(() => import(`./routes/${id}.route.tsx`));
}

export function getRoutes() {
  // for vite
  return Array.from(
    new Set(
      Array.from(loadRoute.toString().matchAll(/routes\/(.*?)[.]route[.]tsx/g))
        .map((v) => v[1])
        .filter((v) => !v.includes('${id}')),
    ),
  ).sort();
}
