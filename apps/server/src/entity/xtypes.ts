import { IntegerType } from '@mikro-orm/core';

export class IntType extends IntegerType {
  convertToJSValue(value: number | undefined): number | undefined {
    if (typeof value === 'string') {
      return Number.parseInt(value, 10);
    }

    return value;
  }
}

export const xtypes = {
  int: IntType,
};
