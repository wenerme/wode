'use client';

import { useEffect, type FC } from 'react';
import { TrackerStore } from './MatomoTrackerStore';

export const MatomoTracker: FC<{ siteId: string; url: string; useUserId?: () => string | undefined }> = ({
  siteId,
  url,
  useUserId = () => undefined,
}) => {
  useEffect(() => {
    TrackerStore.getState().init({
      baseUrl: url,
      siteId,
    });
  }, [siteId, url]);
  let userId = useUserId();
  useEffect(() => {
    const tracker = window.Matomo?.getTracker();
    if (!tracker) {
      return;
    }
    if (userId) {
      tracker.setUserId(userId);
    } else {
      tracker.resetUserId();
    }
  }, [userId]);

  return null;
};
