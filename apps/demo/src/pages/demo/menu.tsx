import type { NextPage } from 'next';
import Head from 'next/head';
import React from 'react';
import { MenuToolItem } from '@src/contents/TipTap/TipTapWord/Toolbar/MenuToolItem';
import { useImmer } from 'use-immer';
import { SettingMenuItems } from '@src/contents/TipTap/TipTapWord/Toolbar/Toolbar';

const DemoMenu = () => {
  const [state, update] = useImmer<Record<string, any>>({});
  return (
    <div className={'container mx-auto'}>
      <MenuToolItem
        items={SettingMenuItems}
        getItemProps={(v) => {
          let active = !v.disabled && v.value !== undefined && v.name && state[v.name] === v.value;
          let props: Record<string, any> = {};
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
