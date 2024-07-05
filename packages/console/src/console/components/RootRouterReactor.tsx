import React, { PropsWithChildren, useEffect } from 'react';
import { useInRouterContext } from 'react-router-dom';
import { ReactRouterTracker } from '@/console/components/ReactRouterTracker';
import { useRouteTitles } from '@/router';

export const RootRouterReactor: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <RouterReactor />
      <ReactRouterTracker />
    </>
  );
};

const RouterReactor = () => {
  useRouteTitleUpdate();
  return null;
};

function useRouteTitleUpdate() {
  if (!useInRouterContext()) {
    return null;
  }
  const titles = useRouteTitles();
  const title = titles.join(' » ');
  useEffect(() => {
    document.title = title;
  }, [title]);
}
