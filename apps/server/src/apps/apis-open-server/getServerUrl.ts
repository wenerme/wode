import { getContext } from '../../app/app.context';
import { ServerConfig, serverConfig } from '../../app/config/server.config';

export function getServerUrl(u?: string) {
  const base = getContext<ServerConfig>(serverConfig.KEY)?.url || 'http://localhost:3000';
  if (!u) {
    return base;
  }
  return new URL(u.replace(/^\/+/, ''), base.replace(/\/*$/, '/')).toString();
}
