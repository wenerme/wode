import { DynamicModule } from '@wener/console/web';
import { isDev } from '@/const';

export function loadDemoModule(name: string): Promise<DynamicModule> {
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
