import type { Provider } from 'next-auth/providers';
import GithubProvider from 'next-auth/providers/github';
import GitlabProvider from 'next-auth/providers/gitlab';
import { WechatWebProvider } from '../wechat';
import { WecomWebProvider } from '../wecom/WecomWebProvider';

export interface AuthProviderConfig {
  id?: string;
  type: string;
  name?: string;
  clientId: string;
  clientSecret: string;
  enabled?: boolean;
  clientConfig?: Record<string, any>;
}

export function buildAuthProvider({
  type,
  id,
  name,
  clientConfig,
  clientSecret,
  clientId,
}: AuthProviderConfig): Provider {
  switch (type) {
    case 'wecom-web':
      return WecomWebProvider({
        clientId,
        clientSecret,
        agentId: clientConfig?.agentId,
        ...clientConfig,
      });
    case 'wechat-web':
      return WechatWebProvider({
        clientId,
        clientSecret,
        ...clientConfig,
      });
    case 'gitlab':
      return GitlabProvider({
        id: id || `gitlab@${clientId}`,
        name,
        allowDangerousEmailAccountLinking: true,
        clientId,
        clientSecret,
        ...clientConfig,
      });
    case 'github':
      return GithubProvider({
        id: id || `github@${clientId}`,
        name,
        allowDangerousEmailAccountLinking: true,
        clientId,
        clientSecret,
        ...clientConfig,
      });
    default:
      throw new Error(`Unknown auth provider type: ${type}`);
  }
}
