import React from 'react';
import { DaisyThemePage } from '@/app/daisy/theme/DaisyThemePage';
import { PageContainer } from '@/components/pages/PageContainer';
import { PageLayout } from '@/components/pages/PageLayout';
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
