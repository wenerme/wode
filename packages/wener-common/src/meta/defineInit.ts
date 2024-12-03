import type { MaybePromise } from '@wener/utils';
import { startCase } from 'es-toolkit';

type DefineInitOptions = {
  name: string;
  title?: string;
  onInit?: () => any;
  metadata?: Record<string, any>;
};
export type InitDef = {
  name: string;
  title: string;
  onInit?: () => any;
  metadata: Record<string, any>;
};
let _all: InitDef[] = [];

export function defineInit(o: DefineInitOptions) {
  const def = {
    title: startCase(o.name),
    metadata: {},
    ...o,
  };
  let idx = _all.findIndex((v) => v.name === def.name);
  if (idx >= 0) {
    console.warn(`skip redefined init: ${def.name}`);
  } else {
    _all.push(def);
  }

  return def;
}

let result = new Map<any, MaybePromise<InitResult>>();

type InitResult = {
  name: string;
  success: boolean;
  error?: any;
};

export async function runInit(inits = _all) {
  for (let init of inits) {
    if (result.get(init)) {
      return;
    }
    result.set(
      init,
      Promise.resolve().then(async () => {
        let out: InitResult = {
          name: init.name,
          success: true,
        };
        try {
          await init.onInit?.();
        } catch (e) {
          console.error(`Failed to init ${init.name}`, e);
          out.success = false;
          out.error = e;
        }
        result.set(init, out);
        return out;
      }),
    );
  }

  return Promise.all(result.values());
}
