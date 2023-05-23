import { type INestApplicationContext } from '@nestjs/common';
import { getContext } from '../app.context';

export class InjectToken<T> {
  private constructor(private readonly name: string) {}

  static of<T>(name: string) {
    return new InjectToken<T>(name);
  }

  get = (ctx?: INestApplicationContext): T => {
    if (ctx) {
      return ctx.get(this as any);
    }
    return getContext(this as any);
  };

  toString() {
    return `InjectToken(${this.name})`;
  }
}
