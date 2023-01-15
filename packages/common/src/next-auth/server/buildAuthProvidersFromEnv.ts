import type { Provider } from 'next-auth/providers';
import type { AuthProviderConfig } from './buildAuthProvider';
import { buildAuthProvider } from './buildAuthProvider';

export function buildAuthProvidersFromEnv(): Provider[] {
  const configs: AuthProviderConfig[] = [];

  {
    const {
      AUTH_WECOM_WEB_CLIENT_ID: clientId,
      AUTH_WECOM_WEB_CLIENT_SECRET: clientSecret,
      AUTH_WECOM_WEB_AGENT_ID: agentId,
    } = process.env;
    if (clientId && clientSecret && agentId) {
      configs.push({
        type: 'wecom-web',
        clientId,
        clientSecret,
        clientConfig: { agentId },
      });
    }
  }
  {
    const { AUTH_WECHAT_WEB_CLIENT_ID: clientId, AUTH_WECHAT_WEB_CLIENT_SECRET: clientSecret } = process.env;
    if (clientId && clientSecret) {
      configs.push({
        clientId,
        clientSecret,
        type: 'wechat-web',
      });
    }
  }
  for (const type of ['gitlab', 'github']) {
    const {
      [`AUTH_${type.toUpperCase()}_CLIENT_ID`]: clientId,
      [`AUTH_${type.toUpperCase()}_CLIENT_SECRET`]: clientSecret,
    } = process.env;
    if (clientId && clientSecret) {
      configs.push({
        clientId,
        clientSecret,
        type,
        name: type.slice(0, 1).toUpperCase() + type.slice(1),
        clientConfig: { allowDangerousEmailAccountLinking: true },
      });
    }
  }

  return configs.map(buildAuthProvider);
}
