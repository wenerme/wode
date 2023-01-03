import { z } from 'zod';
import zxcvbn from 'zxcvbn';
import { publicProcedure, router } from '../trpc';

export const passwordRouter = router({
  zxcvbn: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/password/zxcvbn' } })
    .input(
      z.object({
        password: z.string(),
      }),
    )
    .output(z.object({}).passthrough())
    .query(({ input: { password } }) => {
      return zxcvbn(password);
    }),
});
