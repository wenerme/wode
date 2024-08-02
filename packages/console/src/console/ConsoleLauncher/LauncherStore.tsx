import { ReactNode } from 'react';
import { mutative } from '@wener/reaction/mutative/zustand';
import _ from 'lodash';
import { createStore } from 'zustand';
import { getLauncherStore } from '@/console/container';

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

export function createLauncherStore() {
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
