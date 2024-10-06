import { Logger } from '@nestjs/common';
import { classOf } from '@wener/utils';
import { GraphQLScalarType } from 'graphql';

const log = new Logger('FileScalar');
export const FileScalar = new GraphQLScalarType({
  name: 'File',
  description: 'The `File` scalar type represents a file upload.',
  specifiedByURL: 'https://the-guild.dev/graphql/yoga-server/docs/features/file-uploads',
  parseValue: (value) => {
    if (!(value instanceof File)) {
      log.warn(`Invalid FileScalar ${classOf(value)} "${value}"`);
      throw new Error(`Invalid File`);
    }
    return value;
  },
});
