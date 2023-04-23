import { type FetchLike } from '@wener/utils';

export const Injects = {
  fetch: tokenOf<FetchLike>('fetch'),
};

function tokenOf<T>(name: string): InjectToken<T> {
  return Symbol.for(`Injects.${name}`);
}

export type InjectToken<T> = symbol;
