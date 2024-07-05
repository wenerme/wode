import type { HTMLProps, ReactElement, ReactNode } from 'react';
import React, { forwardRef, useState } from 'react';
import { HiChevronDown, HiChevronRight } from 'react-icons/hi2';
import { PiCaretDoubleLeftThin, PiCaretDoubleRightThin } from 'react-icons/pi';
import { AutoNavLink } from '@wener/console/web';
import { flexRender, FlexRenderable, useControllable } from '@wener/reaction';
import { clsx } from 'clsx';
import { Tooltip } from '@/floating';
import { HeaderContentFooterLayout } from '@/web/components/HeaderContentFooterLayout';
import { LeftContentRightLayout } from '@/web/components/LeftContentRightLayout';
import { OverlayScrollbar } from '@/web/components/OverlayScrollbar';
import type { BaseNavLink } from './BaseNavLink';

interface ExpandableSideMenuTitle {
  type: 'title';
  label: string;
  icon?: ReactElement;
  iconActive?: ReactElement;
}

interface ExpandableSideMenuItem {
  type?: 'item';
  label?: string;
  icon?: FlexRenderable<any>;
  iconActive?: FlexRenderable<any>;
  href: string;
  end?: boolean;
}

interface ExpandableSideMenuGroup {
  type?: 'group';
  label: string;
  icon?: ReactElement;
  iconActive?: ReactElement;
  end?: boolean;
  children: ExpandableSideMenuItem[];
}

export type ExpandableSideMenuItemProps = ExpandableSideMenuItem | ExpandableSideMenuGroup | ExpandableSideMenuTitle;

export interface ExpandableSideMenuLayoutProps extends Omit<HTMLProps<HTMLDivElement>, 'title'> {
  header?: FlexRenderable<{ expanded: boolean }>;
  title?: ReactNode;
  icon?: ReactElement;

  children?: React.ReactNode;
  items: Array<ExpandableSideMenuItemProps>;
  expanded?: boolean;
  initialExpanded?: boolean;
  onExpandedChange?: (v: boolean) => void;
  NavLink?: BaseNavLink;
}

const SideMenuItem: React.FC<{ item: ExpandableSideMenuItemProps; expanded?: boolean; NavLink?: BaseNavLink }> = ({
  item,
  expanded,
  NavLink = AutoNavLink,
}) => {
  const [collapse, setCollapse] = useState(true);
  if ('children' in item) {
    const { label, icon, children } = item;

    if (!expanded) {
      return (
        <li>
          <span>{icon}</span>
        </li>
      );
    }
    return (
      <>
        <li
          onClick={() => {
            setCollapse(!collapse);
          }}
        >
          <span>
            {icon}
            {label}
            <span className={'flex-1'} />
            {collapse ? <HiChevronRight /> : <HiChevronDown />}
          </span>
        </li>
        {!collapse &&
          children.map((item, i) => {
            return (
              <SideMenuItem
                expanded
                item={{
                  ...item,
                  type: 'item',
                  icon: <div className={'inline-block w-4'} />,
                  iconActive: undefined,
                }}
                key={`${label}/${i}`}
              />
            );
          })}
      </>
    );

    // fixme collapse not works
    // return (
    //   <li className="collapse">
    //       <span tabIndex={0} className="collapse-title">
    //         {icon}
    //         {label}
    //       </span>
    //         <ul
    //           className={classNames(
    //             // "collapse-content",
    //             // ' gap-0.5 bg-base-100',
    //           )}
    //         >
    //           {children.map((item, i) => {
    //             return <li key={i}>
    //               <span>{item.label}</span>
    //             </li>
    //           })}
    //         </ul>
    //   </li>
  }

  if (item.type === 'title') {
    if (!expanded) {
      return (
        <li className={'menu-title w-full px-0.5 py-0'}>
          <span className={'w-full truncate text-center text-[10px]'}>{item.label}</span>
        </li>
      );
    }
    return (
      <li className={'menu-title'}>
        <span>{item.label}</span>
      </li>
    );
  }

  const { href, icon, end, iconActive, label } = item;
  // data-tooltip 由于 overflow 实际无法显示
  return (
    <Tooltip portal content={!expanded && label} placement={'right'} className={'hidden md:block'}>
      <li>
        <NavLink
          href={href}
          end={end}
          title={label}
          className={({ isActive }) => clsx(expanded ? '' : 'justify-center p-2', isActive ? 'active' : 'inactive')}
        >
          {({ isActive: active }) => {
            let ico = flexRender(
              active ? iconActive || icon : icon,
              {
                active,
                className: 'w-6 h-6',
              },
              true,
            );

            return (
              <>
                {ico}
                {expanded && label}
              </>
            );
          }}
        </NavLink>
      </li>
    </Tooltip>
  );
};

export const ExpandableMenu: React.FC<ExpandableSideMenuLayoutProps> = ({
  expanded,
  title,
  header: _header,
  icon,
  items,
  onExpandedChange,
  children,
}) => {
  return (
    <HeaderContentFooterLayout
      className={clsx('z-30 border-r border-base-300', 'transition-[width]', expanded ? 'w-[200px]' : 'w-[49px]')}
      header={
        <header
          className={clsx('flex flex-wrap items-center py-4 text-xl font-light', expanded ? 'px-4' : 'justify-center')}
        >
          {icon}
          {expanded && title && <span className={'pl-2'}>{title}</span>}
          {flexRender(_header, { expanded })}
        </header>
      }
      footer={
        <div
          data-tip={expanded ? '收起侧边栏' : '展开侧边栏'}
          className={clsx(
            'flex flex-col items-stretch',
            'font-thin opacity-75',
            // 都通过 tooltip 提示
            // !expanded && 'tooltip tooltip-right',
            'tooltip tooltip-right',
          )}
        >
          <button
            type={'button'}
            onClick={() => {
              onExpandedChange?.(!expanded);
            }}
            className={'flex h-12 items-center p-4 hover:bg-base-300'}
          >
            {expanded ? <PiCaretDoubleLeftThin /> : <PiCaretDoubleRightThin />}
            {/*{expanded && <span>收起侧边栏</span>}*/}
          </button>
        </div>
      }
    >
      <OverlayScrollbar className={'h-full'}>
        <ul className={clsx('menu gap-0.5 bg-base-100', expanded ? 'p-2' : 'p-0')}>
          {items.map((item, i) => {
            return <SideMenuItem item={item} expanded={expanded} key={i} />;
          })}
        </ul>
        {children}
      </OverlayScrollbar>
    </HeaderContentFooterLayout>
  );
};

export const ExpandableSideMenuLayout = forwardRef<HTMLDivElement, ExpandableSideMenuLayoutProps>(
  (
    {
      children,
      header: _header,
      title,
      icon,
      items,
      NavLink = AutoNavLink,
      expanded: _expanded,
      onExpandedChange: _onExpandedChange,
      initialExpanded: _initialExpanded,
      ...props
    },
    ref,
  ) => {
    const [expanded, setExpanded] = useControllable(
      _expanded,
      _onExpandedChange,
      () =>
        _initialExpanded ?? (typeof window === 'undefined' ? true : window.matchMedia('(min-width: 768px)').matches),
    );

    return (
      <LeftContentRightLayout
        className={'h-full'}
        left={
          <ExpandableMenu
            expanded={expanded}
            onExpandedChange={setExpanded}
            title={title}
            items={items}
            icon={icon}
            header={_header}
          />
        }
        ref={ref}
      >
        {children}
      </LeftContentRightLayout>
    );
  },
);
ExpandableSideMenuLayout.displayName = 'ExpandableSideMenuLayout';
