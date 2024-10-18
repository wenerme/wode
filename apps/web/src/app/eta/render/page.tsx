import React from 'react';
import { EtaRenderPage } from '@/app/eta/render/EtaRenderPage';
import { PageContainer } from '@/components/page/PageContainer';
import { PageLayout } from '@/components/page/PageLayout';
import type { NextPageProps } from '@/types';

export default async function (props: NextPageProps) {
  return (
    <PageLayout>
      <PageContainer className={'py-4'}>
        <EtaRenderPage />
      </PageContainer>
    </PageLayout>
  );
}
