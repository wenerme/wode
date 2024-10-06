import React, { memo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { getRootWindow } from './ReactWindow';
import { WindowGuest } from './WindowGuest';

export const WindowHost = memo(() => {
  const [host$] = useState(() => {
    let id = 'react-window-host';
    let host = document.getElementById(id);
    if (host) {
      return host;
    }
    host = document.createElement('div');
    host.id = id;
    host.className = 'absolute overflow-hidden w-screen h-screen left-0 top-0 pointer-events-none isolate z-40';
    document.body.appendChild(host);
    return host;
  });

  let store = getRootWindow().root;
  const windows = useStoreWithEqualityFn(store, ({ windows }) => {
    return windows;
  });

  return (
    <>
      {windows.map((win) => {
        return createPortal(<WindowGuest key={win.id} win={win} />, host$, win.id);
      })}
    </>
  );
});
