import fs from 'node:fs/promises';
import { z } from 'zod';
import { createExpireValue, CreateExpireValueOptions } from '../../ExpireValue';

export function createFileExpiryValue<T>({
  path,
  loader,
}: {
  path: string;
  loader: CreateExpireValueOptions<T>['loader'];
}) {
  let init = 0;
  return createExpireValue<T>({
    onLoad: async (v) => {
      // skip first write
      if (init > 1) {
        await fs.writeFile(path, JSON.stringify(v, null, 2));
      }
    },
    loader: () => {
      if (init++) {
        return loader();
      }
      return Promise.resolve().then(async () => {
        try {
          let val = ExpiryValueSchema.parse(JSON.parse(await fs.readFile(path, 'utf8')));
          if (val.expiresAt > new Date()) {
            return val as any;
          }
        } catch (e) {}
        return loader();
      });
    },
  });
}

const ExpiryValueSchema = z.object({
  value: z.any(),
  expiresAt: z.coerce.date(),
});
