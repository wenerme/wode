import type React from 'react';
import { useEffect, type PropsWithChildren } from 'react';
import { useInRouterContext } from 'react-router-dom';
import { useRouteTitles } from '../../router';
import { ReactRouterTracker } from './ReactRouterTracker';

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
