import React, { createContext, useContext, type ReactNode } from 'react';
import { clamp, getGlobalStates, randomUUID } from '@wener/utils';
import { createStore } from 'zustand';
import { mutative } from 'zustand-mutative';

export const WindowContext = createContext<ReactWindow | null>(null);

export function useWindow(): ReactWindow {
  return useContext(WindowContext) || getRootWindow();
}

export function getRootWindow(): ReactRootWindow {
  return getGlobalStates('ReactRootWindow', () => new ReactRootWindow());
}

interface RootWindowState {
  maximized?: ReactWindow;
  windows: ReactWindow[];
}

function createRootWindowStore(init: Partial<RootWindowState> = {}) {
  return createStore(
    mutative<RootWindowState>((setState, getState, store) => {
      return {
        maximized: undefined,
        windows: [],
        ...init,
      };
    }),
  );
}

export type RootWindowStore = ReturnType<typeof createRootWindowStore>;

interface WindowBaseState {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;

  minimized: boolean;
  maximized: boolean;
  canMaximize: boolean;
  canMinimize: boolean;
  canResize: boolean;
  canDrag: boolean;
  canFullscreen: boolean;
  fullscreen: boolean;

  frameless: boolean;

  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;

  title?: string;
  icon?: ReactNode;
  render?: () => ReactNode;

  meta: Record<string, any>;
  attributes: Record<string, any>;
  properties: Record<string, any>;
}

export interface WindowState extends WindowBaseState {
  // single level
  // windows: ReactWindow[];

  windowElement?: HTMLElement | null;
  bodyElement?: HTMLElement | null;
}

const WindowSizes = {
  xs: { width: 200, height: 200 },
  sm: { width: 400, height: 300 },
  md: { width: 600, height: 400 },
  lg: { width: 800, height: 600 },
  xl: { width: 1000, height: 800 },
  xxl: { width: 1200, height: 800 },
};

const FrameSize = {
  title: 28,
  border: 1,
  width: 2,
  height: 28 + 2,
};

function normalize(init: Partial<WindowBaseState>): WindowBaseState {
  return {
    zIndex: 0,
    minimized: false,
    maximized: false,
    canMaximize: true,
    canMinimize: true,
    canResize: true,
    canDrag: true,
    minWidth: 200,
    minHeight: 200,
    meta: {},
    attributes: {},
    properties: {},
    frameless: false,
    canFullscreen: true,
    fullscreen: false,
    ...init,
    ...normalizeCoordinate(init),
  };
}

function normalizeCoordinate(
  {
    width = WindowSizes.md.width,
    height = WindowSizes.md.height,
    x,
    y,
  }: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  },
  { center }: { center?: boolean } = {},
) {
  const { innerWidth: ww, innerHeight: wh } = window;

  width = clamp(width, WindowSizes.xs.width, ww);
  height = clamp(height, WindowSizes.xs.height, wh);

  let cx = (ww - width) / 2;
  let cy = (wh - height) / 2;

  if (center) {
    x = cx;
    y = cy;
  }

  x = clamp(x || cx, 0, ww - width);
  y = clamp(y || cy, 0, wh - height);
  return {
    x,
    y,
    width,
    height,
  };
}

function createWindowStore(init: Partial<WindowState> = {}) {
  return createStore(
    mutative<WindowState>((setState, getState, store) => {
      return normalize(init);
    }),
  );
}

type WindowStore = ReturnType<typeof createWindowStore>;

export class ReactWindow extends EventTarget {
  public readonly id: string;
  public readonly key: string;
  readonly store: WindowStore;
  readonly parent?: ReactWindow;

  private static MaximizedWindow?: ReactWindow;

  constructor({ id, key, store, parent }: { id: string; key?: string; store?: WindowStore; parent?: ReactWindow }) {
    super();
    this.id = id;
    this.key = key || id;
    this.parent = parent;
    this.store = store || createWindowStore();
  }

  get state() {
    return this.store.getState();
  }

  get body() {
    return this.state.bodyElement;
  }

  setBody = (ref: HTMLElement | null | undefined) => {
    let current = this.state.bodyElement;
    if (current === ref) {
      return;
    }
    // do initial focus
    if (!current) {
      ref?.focus();
    }
    this.store.setState({ bodyElement: ref });
  };

  close = (data?: any) => {
    this.dispatchEvent(new CustomEvent('close', { detail: data }));
  };

  focus = () => {
    let ele = this.state.bodyElement;
    if (!ele) {
      return;
    }
    if (!document.activeElement || !ele?.contains(document.activeElement)) {
      ele?.focus();
      this.dispatchEvent(new Event('focus'));
    }
  };

  minimize = (minimize?: boolean) => {
    let current = this.state.minimized;
    minimize = minimize ?? !current;
    if (minimize === current) {
      return;
    }

    this.store.setState((s) => {
      s.minimized = minimize;
      s.maximized = false;
    });
    this.dispatchEvent(new Event('minimize'));
  };

  maximize = (maximize?: boolean) => {
    let current = this.state.maximized;
    maximize = maximize ?? !current;
    if (maximize === current) {
      return;
    }

    this.store.setState((s) => {
      if (maximize && !s.maximized) {
        s.maximized = true;
        s.minimized = false;

        s.properties['last'] = [s.x, s.y, s.width, s.height];

        s.width = window.innerWidth;
        s.height = window.innerHeight;
        s.x = 0;
        s.y = 0;

        ReactWindow.MaximizedWindow = this;
      } else if (!maximize && s.maximized) {
        s.maximized = false;
        s.minimized = false;

        const [x, y, width, height] = s.properties['last'] ?? [];
        s.width = width;
        s.height = height;
        s.x = x;
        s.y = y;
        Object.assign(s, normalizeCoordinate(s));
        ReactWindow.MaximizedWindow = undefined;
      }
    });
    if (maximize) {
      this.dispatchEvent(new Event('maximize'));
    } else {
      this.dispatchEvent(new Event('restore'));
    }
  };

  center = () => {
    this.store.setState(normalizeCoordinate(this.store.getState(), { center: true }));
  };

  open = (opts: WindowOpenOptions) => {
    getRootWindow().open(opts);
  };
}

class ReactRootWindow extends ReactWindow {
  private zIndex = 1;
  readonly root: RootWindowStore;
  current?: ReactWindow;

  constructor() {
    super({ id: 'root' });
    this.root = createRootWindowStore();
  }

  get top(): ReactWindow | undefined {
    if (this.current) {
      return this.current;
    }
    return this.windows.filter((v) => !v.state.minimized).toSorted((a, b) => a.state.zIndex - b.state.zIndex)[0];
  }

  get windows() {
    return this.root.getState().windows;
  }

  private handleFocusIn = (e: Event, win: ReactWindow) => {
    this.setActive(win);
  };

  private handleFocusOut = (e: Event, win: ReactWindow) => {
    if (win === this.current) {
      this.current = undefined;
    }
  };

  setActive(win: ReactWindow) {
    try {
      const { zIndex } = win.state;
      if (zIndex === this.zIndex) {
        this.current = win;
        win.minimize(false);
        return;
      }
      win.store.setState({ zIndex: ++this.zIndex });
      this.current = win;
    } finally {
      win.focus();
    }
  }

  private find(s: { key?: string }) {
    if (s.key) return this.windows.find((v) => v.key === s.key);
  }

  toggle = (opts: WindowOpenOptions) => {
    let found = this.find(opts);
    if (found) {
      found.close();
      return;
    }
    return this.open(opts);
  };

  open = (opts: WindowOpenOptions) => {
    if (opts.key) {
      let existing = this.root.getState().windows.find((v) => v.key === opts.key);
      if (existing) {
        this.setActive(existing);
        return existing;
      }
    }

    let id = randomUUID();
    let key = opts.key || id;

    if (!opts.frameless) {
      const { width: fw, height: fh } = FrameSize;
      const wkeys: (keyof WindowBaseState)[] = ['width', 'maxWidth', 'minWidth'];
      const hkeys: (keyof WindowBaseState)[] = ['height', 'maxHeight', 'minHeight'];

      for (let key of wkeys) {
        if (opts[key]) {
          (opts as any)[key] += fw;
        }
      }
      for (let key of hkeys) {
        if (opts[key]) {
          (opts as any)[key] += fh;
        }
      }
    }
    let root = this.root;

    let store = createWindowStore({
      ...opts,
      zIndex: this.zIndex++,
    });

    let child = new ReactWindow({
      id,
      key,
      store,
    });

    // const { x, y, width, height } = store.getState();
    // console.log(`open window`, id, { x, y, width, height });

    child.addEventListener('close', () => {
      root.setState((s) => {
        s.windows = s.windows.filter((v) => v !== child);
        this.current === child && (this.current = undefined);
      });
    });

    child.addEventListener('focusin', (e) => this.handleFocusIn(e, child));
    child.addEventListener('focusout', (e) => this.handleFocusOut(e, child));

    root.setState((s) => {
      // fixme typing Element is not draftable
      s.windows.push(child as any);
    });

    this.setActive(child);
    return child;
  };

  close = () => {
    console.error('Cannot close root window');
  };
}

export interface WindowOpenOptions extends Partial<WindowBaseState> {
  key?: string;
}

export namespace ReactWindows {
  export function closeAll() {
    getRootWindow().windows.forEach((v) => v.close());
  }

  export function minimizeAll() {
    getRootWindow().windows.forEach((v) => v.minimize(true));
  }
}
