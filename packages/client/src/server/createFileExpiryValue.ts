import fs from 'node:fs/promises';
import { z } from 'zod';
import { createExpireValueHolder, type CreateExpireValueHolderOptions } from '../ExpiryValue';

export function createFileExpiryValue<T = string>({
  path,
  onLoad,
  ...opts
}: Omit<CreateExpireValueHolderOptions<T>, 'value'> & { path: string }) {
  return createExpireValueHolder<T>({
    ...opts,
    value: Promise.resolve().then(async () => {
      try {
        const val = ExpiryValueSchema.parse(JSON.parse(await fs.readFile(path, 'utf8')));
        if (val.expiresAt > new Date()) {
          return val as any;
        }
      } catch {}
    }),
    async onLoad(v) {
      await fs.writeFile(path, JSON.stringify(v, null, 2));
      return onLoad?.(v);
    },
  });
}

const ExpiryValueSchema = z.object({
  value: z.any(),
  expiresAt: z.coerce.date(),
});
