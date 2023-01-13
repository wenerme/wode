import { proxyWithPersist } from '../../valtio';

export interface PageLayoutState {
  expanded?: boolean;
}

interface GlobalLayoutState {
  pages: Record<string, PageLayoutState>;
}

export function usePageLayoutState(page: string) {
  const state: GlobalLayoutState = ((globalThis as any).GlobalLayoutState ||= proxyWithPersist({
    key: 'GlobalLayoutState',
    initialState: { pages: {} },
  }));
  state.pages[page] ||= { expanded: undefined };
  return state.pages[page];
}
