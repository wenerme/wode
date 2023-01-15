import React, { useEffect } from 'react';
import { useRouteTitles } from 'common/src/router';

export const RootRouteReactor = () => {
  const titles = useRouteTitles();
  const title = titles.join(' » ');
  useEffect(() => {
    document.title = title;
  }, [title]);
  return <></>;
};
