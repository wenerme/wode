import { z } from 'zod';

export const SiteModuleConf = z.object({
  include: z.string().array().default([]),
  disabled: z.string().array().default([]),
});
export type SiteModuleConf = z.infer<typeof SiteModuleConf>;

export const SiteConf = z.object({
  version: z.string().optional(),
  title: z.string().default('System'),
  author: z
    .object({
      name: z.string().default('Wener'),
      link: z.string().optional(),
    })
    .default({}),
  include: z.string().array().default([]).describe('Include external conf'),
  module: SiteModuleConf.default({}),
  api: z
    .object({
      url: z.string().optional(),
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
      basePath: z.string().optional(),
    })
    .default({}),
});
export type SiteConf = z.infer<typeof SiteConf>;
