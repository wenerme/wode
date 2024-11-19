import { describe, expect, it } from 'vitest';
import { ResourceState } from '../../../common/src/schemas/typebox/wode';
import { JsonSchema } from './JsonSchema';

describe('jsonschema', () => {
  it('should create from schema', () => {
    for (const [a, b] of [
      [{ type: 'string' }, ''],
      [{ type: 'number' }, 0],
      [{ type: 'number', default: 1 }, 1],
      [{ type: 'integer' }, 0],
      [{ type: 'array' }, []],
      [{ type: 'object' }, {}],
      [ResourceState, 'Active'],
    ]) {
      expect(JsonSchema.create(a)).toEqual(b);
    }
  });
});
