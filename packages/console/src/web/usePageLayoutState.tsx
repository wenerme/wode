import { proxyWith } from '../components/valtio';

// export interface PageLayoutState {
//   expanded?: boolean;
// }

interface GlobalLayoutState {
  pages: Record<string, any>;
}

export function usePageLayoutState(
  page: string,
  {
    initial = {},
  }: {
    initial?: any;
  } = {},
) {
  const state: GlobalLayoutState = proxyWith({
    name: 'GlobalLayoutState',
    global: true,
    storage: true,
    initialState: { pages: {} },
  });
  state.pages[page] ||= initial;
  return state.pages[page];
}
