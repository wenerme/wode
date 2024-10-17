'use client';

import { useEffect, useRef, useState } from 'react';
import { useInterval } from '@wener/reaction';
import type { MaybePromise } from '@wener/utils';
import { UpdateNotificationToast } from './UpdateNotificationToast';

export function UpdateNotification({ getVersion }: { getVersion?: () => MaybePromise<string | undefined> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(getVersion);
  ref.current = getVersion;
  useWebUpdate({
    onUpdate: ({ last, current }) => {
      console.info('New Version', last, '->', current);
      setOpen(true);
    },
    getVersion: async () => {
      try {
        return (await ref.current?.()) || '';
      } catch (e) {
        console.error('check version failed', e);
        return '';
      }
    },
  });

  return <UpdateNotificationToast open={open} onOpenChange={setOpen} />;
}

function useWebUpdate({
  getVersion,
  onUpdate,
}: {
  onUpdate?: (o: { last: string; current: string }) => void;
  getVersion: () => Promise<string>;
}) {
  const lastRef = useRef<string>();
  let visibility = usePageVisibility();
  const doCheck = async () => {
    if (!visibility) {
      return;
    }
    try {
      const ver = await getVersion();
      if (!ver) {
        return;
      }
      const last = lastRef.current;
      lastRef.current = ver;

      if (last && ver !== last) {
        onUpdate?.({
          last,
          current: ver,
        });
      }
    } catch (e) {
      console.error('getVersion failed', e);
    }
  };

  // first time
  useEffect(() => {
    void doCheck();
  }, [visibility]);

  // 3 min
  useInterval(() => doCheck(), 1000 * 60 * 5);
}

function usePageVisibility() {
  const [visible, setVisible] = useState(typeof document === 'undefined' ? true : !document.hidden);
  useEffect(() => {
    const onChange = () => {
      setVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', onChange);
    return () => {
      document.removeEventListener('visibilitychange', onChange);
    };
  }, []);
  return visible;
}
