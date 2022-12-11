import React from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useImmer } from 'use-immer';
import { SettingMenuItems } from '@src/components/TipTapWord/Toolbar/Toolbar';
import { MenuToolItem } from '@src/components/TipTapWord/components/MenuToolItem';

const DemoMenu = () => {
  const [state, update] = useImmer<Record<string, any>>({});
  return (
    <div className={'container mx-auto'}>
      <MenuToolItem
        items={SettingMenuItems}
        getItemProps={(v) => {
          const active = !v.disabled && v.value !== undefined && v.name && state[v.name] === v.value;
          const props: Record<string, any> = {};
          if (active) {
            props['data-active'] = true;
          }
          return props;
        }}
        onItemClick={(e, { name, value }) => {
          if (value !== undefined && name) {
            update((s) => {
              s[name] = value;
            });
          }
        }}
      />
    </div>
  );
};

const CurrentPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Demo Page</title>
      </Head>
      <DemoMenu />
    </>
  );
};

export default CurrentPage;
