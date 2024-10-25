import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { getRootWindow, ReactWindow, type WindowOpenOptions } from './ReactWindow';
import { WindowGuest } from './WindowGuest';

export namespace Window {
  export function closeAll() {
    getRootWindow().windows.forEach((v) => v.close());
  }

  export function minimizeAll() {
    getRootWindow().windows.forEach((v) => v.minimize(true));
  }

  function createWindowContainer(win: ReactWindow) {
    let id = `react-window-container-${win.id}`;
    let host = document.getElementById(id);
    if (host) {
      return host;
    }
    host = document.createElement('div');
    // host.setAttribute('data-react-window-id', win.id);
    host.id = id;
    host.className = 'fixed overflow-hidden w-screen h-screen left-0 top-0 pointer-events-none isolate z-40';
    document.body.appendChild(host);
    return host;
  }

  export const Host = () => {
    const window = getRootWindow();
    const [container, setContainer] = useState<HTMLElement | null>(null);
    let store = window.store;

    // works in ssr
    useEffect(() => {
      let ele = createWindowContainer(window);
      setContainer(ele);
      store.setState({ childrenElement: ele });
      return () => {
        ele.remove();
      };
    }, [window.id]);

    const windows = useStore(
      store,
      useShallow(({ windows }) => {
        return windows;
      }),
    );

    return (
      <>
        {container &&
          windows.map((win) => {
            return createPortal(<WindowGuest key={win.id} win={win} />, container, win.id);
          })}
      </>
    );
  };

  // Host.displayName = 'Window.Host';

  export function getRoot(): ReactWindow;
  export function getRoot() {
    return getRootWindow();
  }

  export function open(opts: WindowOpenOptions) {
    getRootWindow().open(opts);
  }
}
