import React from 'react';
import { HashPage } from '@/components/hash/HashPage';
import { PageContainer } from '@/components/page/PageContainer';
import { PageLayout } from '@/components/page/PageLayout';
import type { NextPageProps } from '@/types';

export default async function (props: NextPageProps) {
  return (
    <PageLayout>
      <PageContainer>
        <HashPage />
      </PageContainer>
    </PageLayout>
  );
}
