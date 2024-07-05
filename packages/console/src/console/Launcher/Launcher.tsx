import React, { ComponentPropsWithoutRef, memo, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PiBrowser } from 'react-icons/pi';
import { mutative } from '@wener/reaction/mutative/zustand';
import _ from 'lodash';
import { createStore, useStore } from 'zustand';
import { getGlobalStates } from '@/state';

interface LauncherItem {
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

export type LauncherStore = ReturnType<typeof createLauncherStore>;

function getLauncherStore() {
  return getGlobalStates('LauncherStore', createLauncherStore);
}

export const Launcher = memo<ComponentPropsWithoutRef<'div'>>(() => {
  let store = getLauncherStore();
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
});

const LauncherContent: React.FC<{ onLaunch?: (v: LauncherItem) => void }> = ({ onLaunch }) => {
  let store = getLauncherStore();
  const { items } = store.getState();
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
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
        getLauncherStore().setState({ open: false });
      }}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          getLauncherStore().setState({ open: false });
        }
      }}
      ref={ref}
    >
      <div className={'absolute inset-0 left-14 bg-base-300/20 backdrop-blur'}>
        <div className={'flex flex-wrap gap-10 px-20 py-10'}>
          {items.map((v) => {
            const { key, title, icon } = v;
            let ico = icon || <PiBrowser />;
            if (React.isValidElement(ico)) {
              ico = React.cloneElement(ico, {
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

export function toggleLauncher(open?: boolean) {
  getLauncherStore().setState((s) => {
    s.open = open ?? !s.open;
  });
}

export function addLaunchItems(items: LauncherItem[]) {
  getLauncherStore().setState((s) => {
    s.items = _.uniqBy(s.items.concat(items), 'key').sort((a, b) => a.title.localeCompare(b.title));
  });
}
