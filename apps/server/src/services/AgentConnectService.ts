import { create } from '@bufbuild/protobuf';
import { timestampFromDate } from '@bufbuild/protobuf/wkt';
import { ifPresent } from '@wener/utils';
import {
  AgentService,
  InfoResponseSchema,
  ReloadResponseSchema,
  type InfoRequest,
  type ReloadRequest,
} from 'common/gen/pb/wener/wode/agent/v1/AgentService_pb';
import dayjs from 'dayjs';

export class AgentConnectService {
  static Schema = AgentService;

  info(req: InfoRequest) {
    let uptime = process.uptime();

    return create(InfoResponseSchema, {
      now: timestampFromDate(new Date()),
      startedAt: timestampFromDate(dayjs().subtract(uptime, 'seconds').toDate()),
      uptime: uptime,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: Intl.DateTimeFormat().resolvedOptions().locale,
    });
  }

  reload(req: ReloadRequest) {
    return create(ReloadResponseSchema, {
      message: `Reload success${ifPresent(req.reason, (v) => ` by ${v}`)}`,
    });
  }
}
