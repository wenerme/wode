import React, { lazy } from 'react';
import { ProdOnly } from '@wener/reaction';
import { useShallow } from 'zustand/react/shallow';
import { useUserId } from '../../console/context';
import { useSiteStore } from './SiteStore';

// avoid browser block the js cause app failed to load
const MatomoTracker = lazy(() => import('../../matomo/MatomoTracker').then((m) => ({ default: m.MatomoTracker })));

export const SiteSidecar = () => {
  const { url, siteId } = useSiteStore(
    useShallow((s) => {
      return {
        url: s.metadata?.matomoUrl,
        siteId: s.metadata?.matomoSiteId,
      };
    }),
  );

  return (
    <>
      <ProdOnly>{siteId && url && <MatomoTracker url={url} siteId={siteId} useUserId={useUserId} />}</ProdOnly>
    </>
  );
};
