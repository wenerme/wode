import React, { type FC, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { PageContainer } from '@/components/page/PageContainer';
import { PageLayout } from '@/components/page/PageLayout';
import { NavLink } from '@/next/NavLink';

export const TabPageLayout: FC<{
  title?: ReactNode;
  children?: ReactNode;
  tabs: Array<{ label: ReactNode; href: string }>;
}> = ({ title, children, tabs }) => {
  return (
    <PageLayout>
      <PageContainer>
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
      </PageContainer>
    </PageLayout>
  );
};
