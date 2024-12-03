import { describe, expect, it } from 'vitest';
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
      [
        {
          type: 'object',
          properties: {
            a: { type: 'string' },
          },
          required: ['a'],
        },
        { a: '' },
      ],
    ]) {
      expect(JsonSchema.create(a)).toEqual(b);
    }
  });
});
