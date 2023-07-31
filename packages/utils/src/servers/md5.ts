import { createHash } from 'node:crypto';

export function md5(input: Buffer | string) {
  return createHash('md5').update(input).digest('hex') as string;
}
