import React, { createContext, useContext } from 'react';
import { useDeepCompareMemo } from '@wener/reaction';

interface PageSizeOptionsContextObject {
  defaultPageSize: number;
  pageSizeOptions: number[];
}

let _default: PageSizeOptionsContextObject = {
  defaultPageSize: 50,
  pageSizeOptions: [20, 30, 50, 100, 200, 300, 500, 1000],
};

const PageSizeOptionsContext = createContext<PageSizeOptionsContextObject | undefined>(undefined);

export function setDefaultPageSizeOptions(options: PageSizeOptionsContextObject) {
  _default = options;
}

export function usePageSizeOptions() {
  return useContext(PageSizeOptionsContext) || _default;
}

export const PageSizeOptionsProvider: React.FC<{
  value: PageSizeOptionsContextObject;
  children: React.ReactNode;
}> = ({ value, children }) => {
  const val = useDeepCompareMemo(() => value, [value]);
  return <PageSizeOptionsContext.Provider value={val}>{children}</PageSizeOptionsContext.Provider>;
};
