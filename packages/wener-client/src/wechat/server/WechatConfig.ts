import { getGlobalThis } from '@wener/utils';
import { z } from 'zod';

export const WechatConfigSchema = z.object({
  appId: z.string(),
  appSecret: z.string(),
  proxy: z.string().optional(),
});

export type WechatConfig = z.infer<typeof WechatConfigSchema>;

export function getWechatConfig(env: Record<string, any> = getGlobalThis().process?.env || {}) {
  return WechatConfigSchema.parse({
    appId: env.WECHAT_APP_ID,
    appSecret: env.WECHAT_APP_SECRET,
    proxy: env.WECHAT_PROXY,
  });
}
