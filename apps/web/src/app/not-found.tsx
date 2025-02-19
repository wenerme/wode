'use client';

import React from 'react';
import { PageContainer } from '@/components/page/PageContainer';
import { PageLayout } from '@/components/page/PageLayout';

export default function ErrorPage() {
	return (
		<PageLayout>
			<PageContainer>
				<h2 className={'text-2xl font-bold'}>Not found</h2>
			</PageContainer>
		</PageLayout>
	);
}
