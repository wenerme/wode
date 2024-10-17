import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type FC,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { PiBrowser } from 'react-icons/pi';
import { getGlobalStates } from '@wener/utils';
import { uniqBy } from 'es-toolkit';
import { createStore, useStore } from 'zustand';
import { mutative } from 'zustand-mutative';

export interface LauncherItem {
  key: string;
  title: string;
  icon?: ReactNode;
  onLaunch?: () => void;
}

interface LauncherStoreState {
  open: boolean;
  items: Array<LauncherItem>;
}

function createLauncherStore() {
  return createStore(
    mutative<LauncherStoreState>(() => {
      return {
        open: false,
        items: [],
      };
    }),
  );
}

function LauncherHost() {
  let store = Launcher.useStore();
  let open = useStore(store, (s) => s.open);
  if (!open) {
    return null;
  }
  return createPortal(
    <LauncherContent
      onLaunch={(v) => {
        v.onLaunch?.();
      }}
    />,
    document.body,
    'Launcher',
  );
}

export type LauncherStore = ReturnType<typeof createLauncherStore>;
export type ConsoleLauncherProps = ComponentPropsWithoutRef<'div'>;
/**
 * @deprecated use {@link Launcher.Host} instead
 */
export const ConsoleLauncher = LauncherHost;

const LauncherContent: FC<{ onLaunch?: (v: LauncherItem) => void }> = ({ onLaunch }) => {
  let store = Launcher.useStore();
  const { items } = store.getState();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, [ref.current]);
  // note 左侧留出来 dock 的位置
  // dismiss layer
  // esc to close
  // 初次渲染自动获取 focus
  return (
    <div
      className={'absolute inset-0 z-[100]'}
      onClick={() => {
        store.setState({ open: false });
      }}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          store.setState({ open: false });
        }
      }}
      ref={ref}
    >
      <div className={'absolute inset-0 left-14 bg-base-300/20 backdrop-blur'}>
        <div className={'flex flex-wrap gap-10 px-20 py-10'}>
          {items.map((v) => {
            const { key, title, icon } = v;
            let ico = icon || <PiBrowser />;
            if (isValidElement(ico)) {
              ico = cloneElement(ico, {
                className: 'w-24 h-24 drop-shadow-lg',
              } as any);
            }
            return (
              <button
                key={key}
                type={'button'}
                className={
                  'flex flex-col items-center justify-center gap-1 rounded-lg bg-gray-300/0 p-2 pt-1 transition-all hover:bg-gray-300/40'
                }
                onClick={() => {
                  onLaunch?.(v);
                }}
              >
                <div>{ico}</div>
                <div className={'text-sm'}>{title}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export namespace Launcher {
  let _getStore = () => getGlobalStates('LauncherStore', createLauncherStore);

  export function setStoreProvider(provider: () => LauncherStore) {
    _getStore = provider;
  }

  export function getStore() {
    return _getStore();
  }

  export function useStore() {
    return getStore();
  }

  export const Host = LauncherHost;

  export function toggle(open?: boolean) {
    getStore().setState((s) => {
      s.open = open ?? !s.open;
    });
  }

  export function addItems(items: LauncherItem[]) {
    getStore().setState((s) => {
      s.items = uniqBy(s.items.concat(items), (v) => v.key).sort((a, b) => a.title.localeCompare(b.title));
    });
  }
}
