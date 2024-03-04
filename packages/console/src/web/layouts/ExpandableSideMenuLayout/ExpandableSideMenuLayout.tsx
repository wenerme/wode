import type { HTMLProps, ReactElement, ReactNode } from 'react';
import React, { forwardRef, useState } from 'react';
import { HiChevronDown, HiChevronRight } from 'react-icons/hi2';
import { PiCaretDoubleLeftThin, PiCaretDoubleRightThin } from 'react-icons/pi';
import { useControllable } from '@wener/reaction';
import { clsx } from 'clsx';
import { Tooltip } from '../../../floating';
import { AutoNavLink } from '../../links';
import type { BaseNavLink } from './BaseNavLink';
import styles from './ExpandableSideMenuLayout.module.css';

interface ExpandableSideMenuTitle {
  type: 'title';
  label: string;
  icon?: ReactElement;
  iconActive?: ReactElement;
}

interface ExpandableSideMenuItem {
  type?: 'item';
  label?: string;
  icon?: ReactElement;
  iconActive?: ReactElement;
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
  header?: React.ReactNode | ((o: { expanded: boolean }) => React.ReactNode);
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
      return null;
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
    <li>
      <Tooltip portal placement={'right'} content={!expanded && label} className={'hidden md:block'}>
        <NavLink
          href={href}
          end={end}
          className={({ isActive }) => clsx(expanded ? '' : 'justify-center p-2', isActive ? 'active' : 'inactive')}
        >
          {({ isActive }) => {
            return (
              <>
                {isActive ? iconActive || icon : icon}
                {expanded && label}
              </>
            );
          }}
        </NavLink>
      </Tooltip>
    </li>
  );
};

export const ExpandableSideMenuLayout = /* @__PURE__ */ forwardRef<HTMLDivElement, ExpandableSideMenuLayoutProps>(
  ({ children, header: _header, title, icon, items, NavLink = AutoNavLink, ...props }, ref) => {
    const [expanded, setExpanded] = useControllable(
      props.expanded,
      props.onExpandedChange,
      () =>
        props.initialExpanded ??
        (typeof window === 'undefined' ? true : window.matchMedia('(min-width: 768px)').matches),
    );

    return (
      <div className={'flex h-full'} ref={ref}>
        <aside
          className={clsx(
            'relative z-30 border-r border-base-300',
            'transition-[width]',
            expanded ? 'w-[200px]' : 'w-[49px]',
          )}
        >
          <div
            className={clsx(
              'absolute inset-0',
              // 避免展开一下子出现，折叠后 tooltip 需要 overflow 才能显示
              expanded && 'overflow-hidden',
            )}
          >
            <div
              className={clsx(
                'flex h-full flex-col',
                // 固定宽度，避免 child wrap
                expanded ? 'w-[199px]' : 'w-[48px]',
              )}
            >
              <header
                className={clsx(
                  'flex flex-wrap items-center border-b border-base-300 py-4 text-xl font-light',
                  expanded ? 'px-4' : 'justify-center',
                )}
              >
                {icon}
                {expanded && title && <span className={'pl-2'}>{title}</span>}
                {typeof _header === 'function' ? _header({ expanded }) : _header}
              </header>
              <div className={`${styles.ScrollShadow} relative flex flex-1 flex-col`}>
                <div className={'scrollbar-thin absolute inset-0'}>
                  <div className={'scroll-shadows max-h-full overflow-y-auto overflow-x-hidden'}>
                    <ul
                      className={clsx(
                        // 不知道为什么里外都要加 scroll-shadows 才能生效
                        styles.ScrollShadow,
                        'menu gap-0.5 bg-base-100',
                        expanded ? 'p-2' : 'p-0',
                      )}
                    >
                      {items.map((item, i) => {
                        return <SideMenuItem item={item} expanded={expanded} key={i} />;
                      })}
                    </ul>
                  </div>
                </div>
              </div>
              <div
                data-tip={'收起侧边栏'}
                className={clsx(
                  'flex flex-col items-stretch',
                  'font-thin opacity-75',
                  !expanded && 'tooltip tooltip-right',
                )}
              >
                <button
                  type={'button'}
                  onClick={() => {
                    setExpanded(!expanded);
                  }}
                  className={'flex h-12 items-center p-4 hover:bg-base-300'}
                >
                  {expanded ? <PiCaretDoubleLeftThin /> : <PiCaretDoubleRightThin />}
                  {expanded && <span>收起侧边栏</span>}
                </button>
              </div>
            </div>
          </div>
        </aside>
        <main className={'relative flex-1'}>
          <div className={'absolute inset-0 overflow-auto'}>{children}</div>
        </main>
      </div>
    );
  },
);
ExpandableSideMenuLayout.displayName = 'ExpandableSideMenuLayout';
