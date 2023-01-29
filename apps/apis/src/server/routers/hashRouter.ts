import { z } from 'zod';
import { hex, sha1, sha256, sha384, sha512 } from '@wener/utils';
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
    .query(async ({ input: { data } }) => {
      return {
        digest: {
          sha1: hex(await sha1(data)),
          sha256: hex(await sha256(data)),
          sha384: hex(await sha384(data)),
          sha512: hex(await sha512(data)),
        },
      };
    }),
});
