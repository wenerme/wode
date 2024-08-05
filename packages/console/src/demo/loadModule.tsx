import { DynamicModule } from '@wener/console/web';
import { isDev } from '../const';
import { loadRoute } from './loadRoute';

export function loadModule(name: string): Promise<DynamicModule> {
  // vite 没问题
  let dyn = (name: string) => import(`./modules/${name}/module.tsx`);
  return dyn(name)
    .then((v) => {
      if (isDev()) {
        console.log(`Loaded module ${name}`, v.default);
      }
      return v;
    })
    .then((v) => v.default);
}

export function getModules() {
  // for vite
  return Array.from(
    new Set(
      Array.from(loadRoute.toString().matchAll(/modules\/(.*?)\/module[.]tsx/g))
        .map((v) => v[1])
        .filter((v) => !v.includes('${id}')),
    ),
  ).sort();
}
