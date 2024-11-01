import React from 'react';
import type { NextLayoutProps } from '@wener/reaction/next';
import { TabPageLayout } from '@/components/page/TabPageLayout';

const NordVPNTabs = [
  {
    label: 'Server',
    href: '/nordvpn/server/',
  },
  {
    label: 'Country',
    href: '/nordvpn/country/',
  },
];

export default function ({ params, children }: NextLayoutProps) {
  // let path = await getServerRequestPath();
  return (
    <TabPageLayout tabs={NordVPNTabs} title={'NordVPN'}>
      {children}
    </TabPageLayout>
  );
}
