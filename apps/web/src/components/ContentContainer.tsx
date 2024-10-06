import type { PropsWithChildren } from 'react';

export const ContentContainer: React.FC<PropsWithChildren> = ({ children }) => {
  return <div className={'container m-auto'}>{children}</div>;
};
