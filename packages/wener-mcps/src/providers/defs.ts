import { registerMcpServerHandler } from './McpServerHandlerDef';
import { ApolloConfigMcpServerHandlerDef } from './apolloconfig';
import { FeishuMcpServerHandlerDef } from './feishu';
import { GeminiSearchMcpServerHandlerDef } from './gemini-search';
import { PrometheusMcpServerHandlerDef } from './prometheus';
import { RelayMcpServerHandlerDef } from './relay';
import { SqlMcpServerHandlerDef } from './sql';
import { TencentClsMcpServerHandlerDef } from './tencent-cls';

registerMcpServerHandler(ApolloConfigMcpServerHandlerDef);
registerMcpServerHandler(FeishuMcpServerHandlerDef);
registerMcpServerHandler(GeminiSearchMcpServerHandlerDef);
registerMcpServerHandler(PrometheusMcpServerHandlerDef);
registerMcpServerHandler(RelayMcpServerHandlerDef);
registerMcpServerHandler(SqlMcpServerHandlerDef);
registerMcpServerHandler(TencentClsMcpServerHandlerDef);

export { ApolloConfigMcpServerHandlerDef } from './apolloconfig';
export { FeishuMcpServerHandlerDef } from './feishu';
export { GeminiSearchMcpServerHandlerDef } from './gemini-search';
export { PrometheusMcpServerHandlerDef } from './prometheus';
export { RelayMcpServerHandlerDef } from './relay';
export { SqlMcpServerHandlerDef } from './sql';
export { TencentClsMcpServerHandlerDef } from './tencent-cls';
