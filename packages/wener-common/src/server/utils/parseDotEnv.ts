import { parseEnv } from 'node:util';

export function parseDotEnv(content: string): Record<string, string> {
  return Object.fromEntries(
    Object.entries(parseEnv(content)).filter((entry): entry is [string, string] => entry[1] !== undefined),
  );
}
