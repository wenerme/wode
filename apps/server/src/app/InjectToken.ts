import { type INestApplicationContext, Type } from '@nestjs/common';
import { getContext } from './app.context';

export type Token<T> = Function & {
  get(ctx?: INestApplicationContext): T | undefined;
};

export class InjectToken<T> {
  private static readonly Store = new WeakMap<any, any>();

  static of<T>(name: Type<T> | string | symbol) {
    let token: Token<T> = this.Store.get(name);
    if (!token) {
      token = Object.assign(() => name, {
        toString: () => `InjectToken(${String(name)})`,
        get: (ctx?: INestApplicationContext): T => {
          if (ctx) {
            return ctx.get(token);
          }
          return getContext(token);
        },
      });
      this.Store.set(name, token);
    }
    return token;
  }
}

