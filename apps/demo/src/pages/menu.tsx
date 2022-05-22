import type { NextPage } from 'next';
import Head from 'next/head';
import styled from 'styled-components';
import { MdAutoAwesome, MdDesktopMac, MdPhone, MdScreenshot, MdSettings, MdTablet } from 'react-icons/md';
import { Menu, MenuItem } from '@src/components/DropdownMenu';
import React, { MouseEventHandler, useMemo, useRef } from 'react';
import { useImmer } from 'use-immer';

const DemoMenu = () => {
  return (
    <div className={'container mx-auto'}>
      <SettingToolItem />
    </div>
  );
};

const MenuContainer = styled.div`
  &.Menu:not(.RootMenu) {
    background-color: white;
    padding: 2px 0;
    border: 1px solid #dadce0;
    border-radius: 4px;
    display: flex;
    flex-flow: column;
    gap: 2px;
    align-items: stretch;

    min-width: 120px;

    & > button {
      text-align: left;
      padding: 4px 6px;
      border-radius: 2px;

      display: flex;
      align-items: center;
      gap: 4px;

      & > .MenuItem__icon {
        width: 16px;
      }

      & > .MenuItem__label {
        flex: 1;
      }

      & > .MenuItem__more {
        color: gray;
      }

      & > .MenuItem__divider {
        margin: 4px 0;
      }

      &:disabled {
        background-color: #f1f3f4;
      }

      &:hover {
        background-color: #f1f3f4;
      }

      &.active,
      &[active],
      &[data-active] {
        color: #1a73e8;
        background-color: #e8f0fe;
      }
    }
  }
`;

const SettingMenu: MenuSpec[] = [
  {
    label: '屏幕',
    icon: <MdScreenshot />,
    name: 'screen',
    children: [
      { label: '自动', value: '' },
      { label: '桌面', icon: <MdDesktopMac />, value: 'desktop' },
      { label: '平板', icon: <MdTablet />, value: 'tablet' },
      { label: '手机', icon: <MdPhone />, value: 'phone' },
    ],
  },
  {
    label: '预设样式',
    icon: <MdAutoAwesome />,
    name: 'preset',
    children: [
      { label: '无', value: '' },
      {
        label: 'Prose',
        value: 'prose',
        name: 'prose',
        icon: <MdTablet />,
        children: [
          { label: 'Gray', value: 'gray' },
          { label: 'Slate', value: 'slate' },
          { label: 'Zinc', value: 'zinc' },
          { label: 'Neutral', value: 'neutral' },
          { label: 'Stone', value: 'stone' },
        ],
      },
    ],
  },
  { type: 'divider' },
  {
    label: 'v1.0',
    disabled: true,
  },
];

type MenuSpec = {
  icon?: React.ReactNode;
  label?: React.ReactNode;
  name?: string;
  value?: any;
  key?: string;
  children?: MenuSpec[];
  disabled?: boolean;
  className?: string;

  type?: 'divider';
};

const SettingToolItem = () => {
  const [state, update] = useImmer<Record<string, any>>({});
  const activeRef = useRef<(v: MenuSpec) => boolean>();
  activeRef.current = (v) => {
    let active = !v.disabled && v.value !== undefined && v.name && state[v.name] === v.value;
    return Boolean(active);
  };
  const handleClickRef = useRef<MouseEventHandler<HTMLButtonElement>>();
  handleClickRef.current = (e) => {
    let name = e.currentTarget.getAttribute('data-name');
    let value = e.currentTarget?.value;
    if (name && value !== undefined) {
      update((s) => {
        s[name || ''] = value;
      });
    }

    console.log(state, e.currentTarget.getAttribute('data-key'), name, value);
  };
  const menu = useMemo(() => {
    const normalize = (m: MenuSpec, i: number, p?: MenuSpec) => {
      let key = [p?.key, m.name || String(i)].filter(Boolean).join('.');
      const out = {
        ...m,
        name: [p?.name, m.name].filter(Boolean).join('.'),
        key: key,
      };
      if (out.type === 'divider') {
        return out;
      }
      out.children ??= [];
      out.children = out.children.map((v, i) => normalize(v, i, out));
      return out;
    };
    return SettingMenu.map((v, i) => normalize(v, i));
  }, [SettingMenu]);

  const renderMenuItem = (v: MenuSpec, i: number) => {
    if (v.type === 'divider') {
      return <hr key={v.key} className={'MenuItem__divider'} />;
    }
    const { key, icon, label, disabled, name, className } = v;
    const props = {
      key,
      icon,
      label,
      'data-key': key,
      'data-name': name,
      disabled,
      className,
      'data-active': activeRef.current?.(v),
    };
    // const cx = [props.className, activeRef.current?.(v) && 'active'];
    // props.className = classNames(...cx);

    if (!props['data-active']) {
      delete props['data-active'];
    }

    if (v.children?.length) {
      return (
        <Menu {...props} onItemClick={(e) => handleClickRef.current?.(e)} as={MenuContainer}>
          {v.children.map(renderMenuItem)}
        </Menu>
      );
    }

    return <MenuItem {...props} value={v.value || ''} />;
  };

  return (
    <Menu as={MenuContainer} label={<MdSettings />} onItemClick={(e) => handleClickRef.current?.(e)}>
      {menu.map(renderMenuItem)}
    </Menu>
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
