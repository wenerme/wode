import React from 'react';
import { EtaRenderPage } from '@/app/[lang]/eta/render/EtaRenderPage';
import { PageContainer } from '@/components/pages/PageContainer';
import { PageLayout } from '@/components/pages/PageLayout';
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
