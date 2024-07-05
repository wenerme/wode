import { useEffect } from 'react';
import { useInRouterContext, useLocation } from 'react-router-dom';
import { useRouteTitles } from '@/router';

export const ReactRouterTracker = () => {
  if (!useInRouterContext()) {
    return null;
  }

  const titles = useRouteTitles();
  const loc = useLocation();
  useEffect(() => {
    const tracker = window.Matomo?.getTracker();
    if (!tracker) {
      return;
    }
    tracker.setCustomUrl(loc.pathname);
    tracker.setDocumentTitle(titles.join('/'));
    tracker.trackPageView();
  }, [loc.pathname]);
  return null;
};
