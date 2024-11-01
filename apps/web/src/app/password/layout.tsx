import React, { type FC, type ReactNode } from 'react';
import type { NextLayoutProps } from '@wener/reaction/next';
import { clsx } from 'clsx';
import { PageContainer } from '@/components/page/PageContainer';
import { PageLayout } from '@/components/page/PageLayout';
import { NavLink } from '@/next/NavLink';

const tabs = [
  {
    label: '密码强度',
    href: '/password/strength/',
  },
  {
    label: '密码哈希',
    href: '/password/hash/',
  },
];

const TabPageLayout: FC<{
  title?: ReactNode;
  children?: ReactNode;
  tabs: Array<{ label: ReactNode; href: string }>;
}> = ({ title, children, tabs }) => {
  return (
    <div className={'flex flex-col gap-4'}>
      <h3 className={'text-2xl font-medium'}>{title}</h3>
      <div className={'flex'}>
        <div role={'tablist'} className={'tabs tabs-bordered tabs-lg'}>
          {tabs.map(({ label, href }) => {
            // role={'tab'}
            return (
              <NavLink key={href} href={href} className={clsx('tab', 'data-[active]:tab-active')}>
                {label}
              </NavLink>
            );
          })}
        </div>
      </div>
      {children}
    </div>
  );
};

export default function ({ params, children }: NextLayoutProps) {
  // let path = await getServerRequestPath();
  return (
    <PageLayout>
      <PageContainer>
        <TabPageLayout tabs={tabs} title={'密码工具'}>
          {children}
        </TabPageLayout>
      </PageContainer>
    </PageLayout>
  );
}
