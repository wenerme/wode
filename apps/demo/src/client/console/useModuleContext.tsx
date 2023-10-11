import { ArrayPath, Path, PathValue } from 'react-hook-form';

export function useModuleContext<O extends Record<string, any>>(): ModuleContextHooks<O> {
  return {
    useWatch(path: string): any {
      return undefined;
    },
  };
}

export interface ModuleContextHooks<O extends Record<string, any> = Record<string, any>> {
  useWatch<P extends Path<O> | ArrayPath<O>, V extends PathValue<O, P>>(path: P): V;
}
