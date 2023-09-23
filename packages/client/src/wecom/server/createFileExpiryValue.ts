import fs from 'node:fs/promises';
import { z } from 'zod';
import { createExpireValueHolder, CreateExpireValueHolderOptions } from '../../ExpiryValue';

export function createFileExpiryValue<T>({
  path,
  onLoad,
  ...opts
}: Omit<CreateExpireValueHolderOptions<T>, 'value'> & { path: string }) {
  return createExpireValueHolder<T>({
    ...opts,
    value: Promise.resolve().then(async () => {
      try {
        let val = ExpiryValueSchema.parse(JSON.parse(await fs.readFile(path, 'utf8')));
        if (val.expiresAt > new Date()) {
          return val as any;
        }
      } catch (e) {}
    }),
    onLoad: async (v) => {
      await fs.writeFile(path, JSON.stringify(v, null, 2));
      return onLoad?.(v);
    },
  });
}

const ExpiryValueSchema = z.object({
  value: z.any(),
  expiresAt: z.coerce.date(),
});
