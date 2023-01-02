import React, { forwardRef, HTMLProps, ReactElement, ReactNode, useState } from 'react';
import { AiOutlineDoubleLeft, AiOutlineDoubleRight } from 'react-icons/ai';
import classNames from 'classnames';
import { AutoNavLink } from '../../components/links';
import { Tooltip } from '../../floating';
import { BaseNavLink } from './BaseNavLink';
import styles from './ExpandableSideMenuLayout.module.css';

export type ExpandableSideMenuItemProps =
  | {
      type?: 'item';
      label?: string;
      icon?: ReactElement;
      iconActive?: ReactElement;
      href: string;
      end?: boolean;
    }
  | {
      type: 'title';
      label: string;
      icon?: ReactElement;
      iconActive?: ReactElement;
    };

export interface ExpandableSideMenuLayoutProps extends Omit<HTMLProps<HTMLDivElement>, 'title'> {
  header?: React.ReactNode | ((o: { expanded: boolean }) => React.ReactNode);
  title?: ReactNode;
  icon?: ReactElement;

  children?: React.ReactNode;
  items: Array<ExpandableSideMenuItemProps>;
  expand?: boolean;
  onExpandChange?: (v: boolean) => void;
  NavLink?: BaseNavLink;
}

const SideMenuItem: React.FC<{ item: ExpandableSideMenuItemProps; expanded?: boolean; NavLink?: BaseNavLink }> = ({
  item,
  expanded,
  NavLink = AutoNavLink,
}) => {
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
  // tooltip 由于 overflow 实际无法显示
  return (
    <li>
      <Tooltip portal placement={'right'} content={!expanded && label} className={'hidden md:block'}>
        <NavLink
          href={href}
          end={end}
          className={({ isActive }) =>
            classNames(expanded ? '' : 'justify-center p-2', isActive ? 'active' : 'inactive')
          }
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

export const ExpandableSideMenuLayout = forwardRef<HTMLDivElement, ExpandableSideMenuLayoutProps>(
  ({ children, header: _header, title, icon, items, NavLink = AutoNavLink }, ref) => {
    const [expanded, setExpanded] = useState(() =>
      typeof window === 'undefined' ? true : window.matchMedia('(min-width: 768px)').matches,
    );

    return (
      <div className={'flex h-full'} ref={ref}>
        <aside
          className={classNames(
            'relative z-30 border-r border-base-300',
            'transition-[width]',
            expanded ? 'w-[200px]' : 'w-[49px]',
          )}
        >
          <div
            className={classNames(
              'absolute inset-0',
              // 避免展开一下子出现，折叠后 tooltip 需要 overflow 才能显示
              expanded && 'overflow-hidden',
            )}
          >
            <div
              className={classNames(
                'flex h-full flex-col',
                // 固定宽度，避免 child wrap
                expanded ? 'w-[199px]' : 'w-[48px]',
              )}
            >
              <header
                className={classNames(
                  'flex flex-wrap items-center border-b border-base-300 py-4 text-xl font-bold',
                  expanded ? 'px-4' : 'justify-center',
                )}
              >
                {icon}
                {expanded && title && <span className={'pl-2'}>{title}</span>}
                {typeof _header === 'function' ? _header({ expanded }) : _header}
              </header>
              <div className={`${styles.ScrollShadow} relative flex flex-1 flex-col`}>
                <div className={'absolute inset-0 scrollbar-thin'}>
                  <div className={'scroll-shadows max-h-full overflow-y-auto overflow-x-hidden'}>
                    <ul
                      className={classNames(
                        // 不知道为什么里外都要加 scroll-shadows 才能生效
                        styles.ScrollShadow,
                        'menu gap-0.5 bg-base-100',
                        expanded ? 'p-2' : '',
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
                className={classNames('flex flex-col items-stretch', !expanded && 'tooltip tooltip-right')}
              >
                <button
                  type={'button'}
                  onClick={() => setExpanded(!expanded)}
                  className={'flex h-12 items-center p-4 hover:bg-base-300'}
                >
                  {expanded ? <AiOutlineDoubleLeft /> : <AiOutlineDoubleRight />}
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
