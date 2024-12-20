import React, { useEffect, useRef } from 'react';
import { PiAppleLogo, PiWindowsLogo } from 'react-icons/pi';
import type { RouteObject } from 'react-router-dom';
import type { Meta } from '@storybook/react';
import { useStore } from 'zustand';
import { ComponentProvider } from '../components';
import { useWindow } from './ReactWindow';
import { WindowFrame } from './WindowFrame';
import { WindowHost } from './WindowHost';
import { getWindowStyleStore } from './WindowStyleStore';
import { WindowTest } from './WindowTest';

const meta: Meta = {
  title: 'console/window',
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

function buildRoutes() {
  return [
    {
      path: '/a1',
      element: <div>A1</div>,
    },
  ] as RouteObject[];
}

export const Windows = () => {
  let store = getWindowStyleStore();
  let theme = useStore(store, (s) => s.theme) ?? 'system';
  let ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!ref.current) {
      return;
    }
    if (theme === 'system') {
      ref.current.indeterminate = true;
    } else {
      ref.current.checked = theme !== 'macos';
    }
  }, [ref.current, theme]);
  return (
    <div className={'flex flex-col gap-4'}>
      <label className={'flex items-center gap-1'}>
        <PiAppleLogo />
        <input
          ref={ref}
          type='checkbox'
          className='toggle toggle-xs'
          onChange={(e) => {
            let loop = ['macos', 'system', 'windows'] as const;
            const next = loop[(loop.indexOf(theme) + 1) % loop.length];
            store.setState({ theme: next });
          }}
        />
        <PiWindowsLogo />
      </label>
      <WindowFrame title={'My Windows Application'}>Hello</WindowFrame>
    </div>
  );
};
export const Demo = () => {
  let win = useWindow();
  return (
    <ComponentProvider components={[]}>
      <div className={'h-full w-full'}>
        <div className={'flex'}>
          <button
            type={'button'}
            className={'btn btn-ghost'}
            onClick={() => {
              win.open({
                title: 'Test Title',
                render: () => {
                  return <WindowTest />;
                },
              });
            }}
          >
            打开窗口
          </button>
          <input type='text' placeholder={'Can input here, the window will not trap the focus'} />
        </div>
        <WindowHost />
      </div>
    </ComponentProvider>
  );
};
