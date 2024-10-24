import React from 'react';
import { ProdOnly } from '@wener/reaction';
import { useShallow } from 'zustand/react/shallow';
import { useUserId } from '../../console/context';
import { MatomoTracker } from '../../matomo';
import { useSiteStore } from './SiteStore';

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
