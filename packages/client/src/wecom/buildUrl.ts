import { buildAuthorizeUrl as _buildAuthorizeUrl, BuildAuthorizeUrlOptions } from '../wechat/buildUrl';

export function buildAuthorizeUrl(
  o: BuildAuthorizeUrlOptions & {
    scope?: 'snsapi_base' | 'snsapi_privateinfo' | 'snsapi_userinfo';
    agentid?: string; // 工作台、聊天工具栏、应用会话内发起oauth2请求的场景中，会触发接口许可的自动激活
  },
) {
  return _buildAuthorizeUrl(o);
}
