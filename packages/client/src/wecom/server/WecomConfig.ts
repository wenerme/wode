import { z } from 'zod';
import { getGlobalThis } from '@wener/utils';

export const WecomConfigSchema = z.object({
  corpId: z.string(),
  corpSecret: z.string().optional(),
  agentId: z.coerce.number().optional(),
  agentSecret: z.string().optional(),
  proxy: z.string().optional(),
});

export type WecomConfig = z.infer<typeof WecomConfigSchema>;

export function getWecomConfig(env: Record<string, any> = getGlobalThis().process?.env || {}) {
  return WecomConfigSchema.parse({
    corpId: env.WECOM_CORP_ID,
    corpSecret: env.WECOM_CORP_SECRET,
    agentId: env.WECOM_AGENT_ID,
    agentSecret: env.WECOM_AGENT_SECRET,
    proxy: env.WECOM_PROXY,
  });
}
