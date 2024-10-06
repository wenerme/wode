import React from 'react';
import { ChinaIdInfoPage } from '@/components/cn/ChinaIdInfoPage';
import { PageContainer } from '@/components/pages/PageContainer';
import { PageLayout } from '@/components/pages/PageLayout';
import type { NextPageProps } from '@/types';

export default async function (props: NextPageProps) {
  return (
    <PageLayout>
      <PageContainer>
        <ChinaIdInfoPage />
      </PageContainer>
    </PageLayout>
  );
}
