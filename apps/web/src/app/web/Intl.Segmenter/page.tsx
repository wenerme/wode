import React from 'react';
import { PageContainer } from '@/components/pages/PageContainer';
import { PageLayout } from '@/components/pages/PageLayout';
import { IntlSegmenterPage } from '@/components/spec/IntlSegmenterPage';
import type { NextPageProps } from '@/types';

export default async function (props: NextPageProps) {
  return (
    <PageLayout>
      <PageContainer className={'py-2'}>
        <IntlSegmenterPage />
      </PageContainer>
    </PageLayout>
  );
}
