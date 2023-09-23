import { z } from 'zod';
import { getGlobalThis } from '@wener/utils';

export const WechatConfigSchema = z.object({
  appId: z.string(),
  appSecret: z.string(),
  proxy: z.string().optional(),
});

export type WechatConfig = z.infer<typeof WechatConfigSchema>;

export function getWechatConfig(env: Record<string, any> = getGlobalThis().process?.env || {}) {
  return WechatConfigSchema.parse({
    corpId: env.WECHAT_APP_ID,
    corpSecret: env.WECHAT_APP_SECRET,
    proxy: env.WECHAT_PROXY,
  });
}
