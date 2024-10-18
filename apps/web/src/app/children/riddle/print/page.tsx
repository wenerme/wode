import React from 'react';
import { RiddlePrintPage } from '@/components/children/RiddlePrintPage';
import { PageLayout } from '@/components/page/PageLayout';
import type { NextPageProps } from '@/types';

export default async function (props: NextPageProps) {
  return (
    <PageLayout>
      <RiddlePrintPage />
    </PageLayout>
  );
}
