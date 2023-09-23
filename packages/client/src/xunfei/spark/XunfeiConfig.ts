import { z } from 'zod';
import { getGlobalThis } from '@wener/utils';

export const XunfeiConfigSchema = z.object({
  url: z.string(),
  appId: z.string(),
  apiKey: z.string(),
  apiSecret: z.string(),
});
export type XunfeiConfig = z.infer<typeof XunfeiConfigSchema>;

export function getXunfeiConfig(env: Record<string, any> = getGlobalThis().process?.env || {}) {
  return XunfeiConfigSchema.parse({
    url: env.XF_URL,
    appId: env.XF_APP_ID,
    apiKey: env.XF_API_KEY,
    apiSecret: env.XF_API_SECRET,
  });
}
