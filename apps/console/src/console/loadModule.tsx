import { isDev } from '@wener/console';
import type { DynamicModule } from '@wener/console/web';

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
