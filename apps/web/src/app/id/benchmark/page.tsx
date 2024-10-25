import React from 'react';
import { IdBenchmarkPage } from '@/app/id/benchmark/IdBenchmarkPage';
import { PageContainer } from '@/components/page/PageContainer';
import { PageLayout } from '@/components/page/PageLayout';

export default function () {
  return (
    <PageLayout>
      <PageContainer>
        <IdBenchmarkPage />
      </PageContainer>
    </PageLayout>
  );
}
