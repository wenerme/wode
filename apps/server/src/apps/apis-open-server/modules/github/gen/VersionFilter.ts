import typia from 'typia';
import { IVersionFilter } from '../repo.controller';

export const isVersionFilter = (input: any): input is IVersionFilter => {
  const $io0 = (input: any): boolean =>
    'boolean' === typeof input.prerelease &&
    'boolean' === typeof input.loose &&
    (undefined === input.range || 'string' === typeof input.range) &&
    (undefined === input.calver || 'only' === input.calver || 'ignore' === input.calver);
  return 'object' === typeof input && null !== input && $io0(input);
};
export const VersionFilterSchema = {
  schemas: [
    {
      $ref: 'components#/schemas/IVersionFilter',
    },
  ],
  components: {
    schemas: {
      IVersionFilter: {
        $id: 'components#/schemas/IVersionFilter',
        type: 'object',
        properties: {
          prerelease: {
            type: 'boolean',
            nullable: false,
            'x-typia-jsDocTags': [
              {
                name: 'default',
                text: [
                  {
                    text: 'false',
                    kind: 'text',
                  },
                ],
              },
            ],
            'x-typia-required': true,
            'x-typia-optional': false,
            default: true,
          },
          loose: {
            type: 'boolean',
            nullable: false,
            'x-typia-jsDocTags': [
              {
                name: 'default',
                text: [
                  {
                    text: 'false',
                    kind: 'text',
                  },
                ],
              },
            ],
            'x-typia-required': true,
            'x-typia-optional': false,
            default: true,
          },
          range: {
            type: 'string',
            nullable: false,
            'x-typia-required': false,
            'x-typia-optional': true,
          },
          calver: {
            type: 'string',
            enum: ['only', 'ignore'],
            nullable: false,
            'x-typia-required': false,
            'x-typia-optional': true,
          },
        },
        nullable: false,
        required: ['prerelease', 'loose'],
        'x-typia-jsDocTags': [],
      },
    },
  },
  purpose: 'ajv',
  prefix: 'components#/schemas',
};
