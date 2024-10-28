import { timestampFromDate } from '@bufbuild/protobuf/wkt';
import { ifPresent } from '@wener/utils';
import dayjs from 'dayjs';
import { AgentInfoResponse, AgentReloadResponse, AgentService } from '@/gen/pb/wener/wode/agent/v1/AgentService_pb';
import { createService } from '@/server/connect/createService';

export function createAgentService() {
  return createService(AgentService, {
    info: async (req) => {
      let uptime = process.uptime();
      return {
        now: timestampFromDate(new Date()),
        startedAt: timestampFromDate(dayjs().subtract(uptime, 'seconds').toDate()),
        uptime: uptime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: Intl.DateTimeFormat().resolvedOptions().locale,
      } as AgentInfoResponse;
    },
    reload: async (req) => {
      return {
        message: `Reload success${ifPresent(req.reason, (v) => ` by ${v}`)}`,
      } as AgentReloadResponse;
    },
  });
}
