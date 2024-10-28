'use client';

import React from 'react';
import type { NextLayoutProps } from '@wener/reaction/next';
import { clsx } from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PageContainer } from '@/components/page/PageContainer';
import { PageLayout } from '@/components/page/PageLayout';

const tabs = [
  {
    label: '密码强度',
    value: 'strength',
  },
  {
    label: '密码哈希',
    value: 'hash',
  },
];

export default function ({ params, children }: NextLayoutProps) {
  // let path = await getServerRequestPath();
  const path = usePathname();
  return (
    <PageLayout>
      <PageContainer>
        <div className={'flex flex-col gap-4'}>
          <h3 className={'text-2xl font-medium'}>密码</h3>
          <div className={'flex'}>
            <div role={'tablist'} className={'tabs tabs-bordered tabs-lg'}>
              {tabs.map(({ label, value }) => {
                let href = `/password/${value}/`;
                let active = path === href;
                return (
                  <Link key={value} href={href} role={'tab'} className={clsx('tab', active && 'tab-active')}>
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
          {children}
        </div>
      </PageContainer>
    </PageLayout>
  );
}
