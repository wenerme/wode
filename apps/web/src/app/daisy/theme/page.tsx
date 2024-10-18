import React from 'react';
import { DaisyThemePage } from '@/app/daisy/theme/DaisyThemePage';
import { PageContainer } from '@/components/page/PageContainer';
import { PageLayout } from '@/components/page/PageLayout';
import type { NextPageProps } from '@/types';

export default async function (props: NextPageProps) {
  return (
    <PageLayout>
      <PageContainer>
        <DaisyThemePage />
      </PageContainer>
    </PageLayout>
  );
}
