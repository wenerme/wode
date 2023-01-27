import React, { useEffect } from 'react';
import { useInRouterContext } from 'react-router-dom';
import { useRouteTitles } from 'common/src/router';

export const RootRouteReactor = () => {
  if (!useInRouterContext()) {
    return null;
  }
  const titles = useRouteTitles();
  const title = titles.join(' » ');
  useEffect(() => {
    document.title = title;
  }, [title]);
  return <></>;
};
