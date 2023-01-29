import { useState } from 'react';
import { Button } from 'common/src/daisy';
import { SystemAbout } from 'common/src/system/components';
import { useTrpcQueryClient } from '../common';

export const AppSystemAbout = () => {
  return (
    <SystemAbout>
      <ServerInfo />
    </SystemAbout>
  );
};

const ServerInfo = () => {
  const [{ now, start, end }, setState] = useState(() => ({
    now: 0,
    start: Date.now(),
    end: 0,
  }));
  const { refetch } = useTrpcQueryClient().ping.useQuery(
    {},
    {
      onSuccess: ({ now }) => {
        setState((s) => ({ ...s, now, end: Date.now() }));
      },
    },
  );
  const offset = Math.ceil((now * 1000 - end + (end - start) / 2) / 1000);
  return (
    <div className={'rounded-lg border p-4 text-sm shadow'}>
      <h3>Server</h3>
      <div className={'prose'}>
        <p>
          ping:{' '}
          {!now ? (
            '...'
          ) : (
            <>
              latency: {end - start}ms, offset: {offset}s
            </>
          )}
          <Button
            onClick={() => {
              setState((s) => ({ ...s, start: Date.now(), now: 0, end: 0 }));
              refetch();
            }}
            size={'xs'}
            ghost
          >
            Refresh
          </Button>
        </p>
      </div>
    </div>
  );
};
