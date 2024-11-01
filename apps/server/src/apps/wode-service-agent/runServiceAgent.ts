import type { ConnectRouter } from '@connectrpc/connect';
import { Logger } from '@nestjs/common';
import { createOpenAPIHono, runServer } from '@wener/nestjs/hono';
import { serveNodeConnect } from '@/server/connect/serveNodeConnect';
import { AgentConnectService } from '@/services/AgentConnectService';

/*
curl -sf --json '{}' http://127.0.0.1:3000/api/connect/wener.wode.agent.v1.AgentService/Info | jq
curl -sf --json '{"reason":"CLI"}' http://127.0.0.1:3000/api/connect/wener.wode.agent.v1.AgentService/Reload | jq
*/

export async function runServiceAgent() {
  let app = createOpenAPIHono();
  let log = new Logger(runServiceAgent.name);

  app.use(
    '/api/connect/*',
    serveNodeConnect({
      prefix: '/api/connect',
      routes: createConnectService,
    }),
  );

  await runServer({
    app,
    env: false,
  });
}

function createConnectService(route: ConnectRouter) {
  route.service(AgentConnectService.Schema, new AgentConnectService());
}
