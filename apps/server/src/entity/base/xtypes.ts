import { IntegerType } from '@mikro-orm/core';

/**
 * sql integer as number instead of string
 */
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
