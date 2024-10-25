import React from 'react';
import IpfsGatewayCheck from '@/components/ipfs/gateway/IpfsGatewayCheck';
import { PageLayout } from '@/components/page/PageLayout';

export default function () {
  return (
    <PageLayout>
      <IpfsGatewayCheck />
    </PageLayout>
  );
}
