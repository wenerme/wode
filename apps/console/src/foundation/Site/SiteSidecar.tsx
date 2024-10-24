import React from 'react';
import { MatomoTracker } from '@wener/console/matomo';
import { useShallow } from 'zustand/react/shallow';
import { ProdOnly } from '@/components/ProdOnly';
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

function useUserId() {
  // fixme
  return undefined;
}
