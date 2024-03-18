'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useInterval } from '@wener/reaction';
import { BuildInfo } from '../buildinfo';
import { UpdateNotification } from '../components/UpdateNotification';

export function WebUpdateNotification() {
  const [open, setOpen] = useState(false);
  const lastRef = useRef<string>();
  let visibility = usePageVisibility();
  const doCheck = async () => {
    if (open) {
      return;
    }
    if (!visibility) {
      return;
    }
    try {
      const res = await fetch('/actions/version');
      const data: BuildInfo = await res.json();
      const ver = data.date;
      const last = lastRef.current;
      lastRef.current = ver;

      if (last && ver !== last) {
        setOpen(true);
      }
    } catch (e) {
      console.error('check version failed', e);
    }
  };

  // first time
  useEffect(() => {
    void doCheck();
  }, [visibility]);

  // 3 min
  useInterval(() => doCheck(), 1000 * 60 * 3);

  return <UpdateNotification open={open} onOpenChange={setOpen} />;
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
