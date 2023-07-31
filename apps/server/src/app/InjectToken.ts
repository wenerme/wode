import { getAppContext } from './app.context';

export type Token<T> = symbol & {
  get(ctx?: Context): T | undefined;
};

interface Context {
  get(token: symbol): any;
}

export class InjectToken<T> {
  static of<T>(key: { readonly name: string } | string): Token<T> {
    const name = typeof key === 'string' ? key : key.name;
    const token = Object.assign(Symbol.for(`InjectToken(${String(name)})`), {
      get: (ctx: Context = getAppContext()): T => {
        return ctx.get(token);
      },
    });
    return token;
  }
}
