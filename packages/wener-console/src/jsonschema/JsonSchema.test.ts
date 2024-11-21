import type { JSONSchema7 } from 'json-schema';
import { describe, expect, it } from 'vitest';
import { ResourceState } from '../../../common/src/schemas/typebox/wode';
import { JsonSchema } from './JsonSchema';

describe('jsonschema', () => {
  it('should create from schema', () => {
    type Case = {
      schema: JSONSchema7;
      matches: Array<{
        input?: any;
        output?: any;
      }>;
    };
    for (const [a, b] of [
      [{ type: 'string' }, ''],
      [{ type: 'number' }, 0],
      [{ type: 'number', default: 1 }, 1],
      [{ type: 'integer' }, 0],
      [{ type: 'array' }, []],
      [{ type: 'object' }, {}],
      [ResourceState, 'Active'],
      [
        {
          type: 'object',
          properties: {
            id: { type: 'string', nullable: true },
            title: { type: 'string', default: 'Untitled' },
            description: { type: 'string' },
          },
          required: ['id', 'title'],
        },
        {
          id: '',
          title: 'Untitled',
        },
      ],
    ]) {
      expect(JsonSchema.create(a)).toEqual(b);
    }
  });
});
