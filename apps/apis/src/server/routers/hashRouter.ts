import { z } from 'zod';
import { publicProcedure, router } from '../trpc';

export const hashRouter = router({
  digest: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/hash/digest' } })
    .input(
      z.object({
        data: z.string(),
        encoding: z.string().optional(),
      }),
    )
    .output(
      z.object({
        digest: z
          .object({
            md4: z.string(),
            md5: z.string(),
            sha1: z.string(),
            sha256: z.string(),
            sha284: z.string(),
            sha512: z.string(),
          })
          .partial(),
      }),
    )
    .query(({ input: { data } }) => {
      return {
        digest: {},
      };
    }),
});
