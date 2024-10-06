import type React from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { useControllable } from '@wener/reaction';
import { HeaderContentFooterLayout } from './HeaderContentFooterLayout';
import { getTitleTabItemKey, TitleTabList, type TitleTabItem } from './TitleTabList';

export type TitleTabContentItem = TitleTabItem & { content?: ReactNode };

export const TitleTabLayout: React.FC<
  {
    children?: ReactNode;
    action?: ReactNode;
    title: ReactNode;
    tabs: Array<TitleTabContentItem>;
    as?: any;
    active?: string;
    onActiveChange?: (active: string) => void;
  } & Omit<ComponentPropsWithoutRef<'div'>, 'title'>
> = ({ children, className, title, active, onActiveChange, tabs, action, ...props }) => {
  let [activeIndex, setActiveIndex] = useControllable(active, onActiveChange, '');

  // no href use first tab
  if (!activeIndex) {
    if (tabs.length && !tabs.some((v) => v.href)) {
      activeIndex = getTitleTabItemKey(tabs[0], 0);
    }
  }

  const activeTab = tabs.find((v, idx) => {
    return getTitleTabItemKey(v, idx) === activeIndex;
  });
  return (
    <HeaderContentFooterLayout
      header={
        <TitleTabList
          {...{
            title,
            tabs,
            action,
            value: activeIndex,
            onValueChange: setActiveIndex,
          }}
          className={'min-h-12'}
        />
      }
      {...props}
    >
      {activeTab?.content}
      {children}
    </HeaderContentFooterLayout>
  );
};
