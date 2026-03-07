import type { NextLayoutProps } from '@wener/reaction/next';
import React from 'react';
import { TabPageLayout } from '@/components/page/TabPageLayout';

const PasswordPageTabs = [
	{ label: '密码强度', href: '/password/strength/' },
	{ label: '密码哈希', href: '/password/hash/' },
];

export default function ({ params, children }: NextLayoutProps) {
	// let path = await getServerRequestPath();
	return (
		<TabPageLayout tabs={PasswordPageTabs} title={'密码'}>
			{children}
		</TabPageLayout>
	);
}
