import React from 'react';
import { PageContainer } from '@/components/pages/PageContainer';
import { PageLayout } from '@/components/pages/PageLayout';
import { SemverTool } from '@/components/semver/SemverTool';
import type { NextPageProps } from '@/types';

export default async function (props: NextPageProps) {
  return (
    <PageLayout>
      <PageContainer>
        <SemverTool />
      </PageContainer>
    </PageLayout>
  );
}
