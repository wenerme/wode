import { z } from 'zod';

export const SiteModuleConf = z.object({
  include: z.string().array().default([]),
  disabled: z.string().array().default([]),
});
export type SiteModuleConf = z.infer<typeof SiteModuleConf>;

export const SiteConf = z.object({
  title: z.string().default('System'),
  author: z
    .object({
      name: z.string().default('Wener'),
      link: z.string().optional(),
    })
    .default({}),
  module: z
    .object({
      src: z.string().optional().describe('Module config url'),
      config: SiteModuleConf.default({}),
    })
    .default({
      config: {
        include: [],
      },
    }),
  api: z
    .object({
      origin: z.string().optional(),
    })
    .default({}),
  trpc: z
    .object({
      servers: z
        .record(
          z.object({
            url: z.string(),
          }),
        )
        .default({}),
    })
    .default({})
    .default({}),
  auth: z
    .object({
      baseUrl: z.string().optional(),
      basePath: z.string().optional(),
    })
    .default({}),
});
export type SiteConf = z.infer<typeof SiteConf>;
