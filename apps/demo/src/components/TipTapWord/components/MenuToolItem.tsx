import type { MouseEvent, MouseEventHandler } from 'react';
import React, { useMemo, useRef } from 'react';
import { MdSettings } from 'react-icons/md';
import classNames from 'classnames';
import styled from 'styled-components';
import { Menu, MenuItem } from '@/components/TipTapWord/components/Menu';

const MenuContainer = styled.div`
  &.Menu {
    z-index: 20;
  }
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

export interface MenuSpec {
  icon?: React.ReactNode;
  label?: React.ReactNode;
  name?: string;
  value?: any;
  key?: string;
  children?: MenuSpec[];
  disabled?: boolean;
  className?: string;

  type?: 'divider';
}

export const MenuToolItem: React.FC<{
  items?: MenuSpec[];
  label?: React.ReactNode;
  getItemProps?: (v: MenuSpec) => Record<string, any>;
  onItemClick?: (e: MouseEvent<HTMLButtonElement>, o: { name?: string; value?: any }) => void;
}> = ({ items = [], getItemProps = () => ({}), onItemClick, label = <MdSettings /> }) => {
  const handleClickRef = useRef<MouseEventHandler<HTMLButtonElement>>();
  handleClickRef.current = (e) => {
    const name = e.currentTarget.getAttribute('data-name') ?? undefined;
    const value = e.currentTarget?.value;

    onItemClick?.(e, {
      name,
      value,
    });
  };
  const menu = useMemo(() => {
    const normalize = (m: MenuSpec, i: number, p?: MenuSpec) => {
      const key = [p?.key, m.name || String(i)].filter(Boolean).join('.');
      const out = {
        ...m,
        name: [p?.name, m.name].filter(Boolean).join('.'),
        key,
      };
      if (out.type === 'divider') {
        return out;
      }
      out.children ??= [];
      out.children = out.children.map((v, i) => normalize(v, i, out));
      return out;
    };
    return items.map((v, i) => normalize(v, i));
  }, [items]);

  const renderMenuItem = (v: MenuSpec, i: number) => {
    if (v.type === 'divider') {
      return <hr key={v.key} className={'MenuItem__divider'} />;
    }
    const { key, icon, label, disabled, name } = v;
    const props = {
      key,
      icon,
      label,
      'data-key': key,
      'data-name': name,
      disabled,
      className: '',
      ...getItemProps(v),
    };
    props.className = classNames(props.className, v.className);

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
    <Menu as={MenuContainer} label={label} onItemClick={(e) => handleClickRef.current?.(e)}>
      {menu.map(renderMenuItem)}
    </Menu>
  );
};
