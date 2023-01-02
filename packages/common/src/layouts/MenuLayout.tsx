import React from 'react';
import { ActiveLink } from '../components/links';

export const MenuLayout: React.FC<{
  children?: React.ReactNode;
  title?: React.ReactNode;
  menu?: Array<{ href: string; label: string }>;
}> = ({ children, title, menu = [] }) => {
  return (
    <div className={'flex h-screen'}>
      <aside className={'w-[200px] flex flex-col border-r border-color'}>
        <header className={'flex items-center py-4 px-2 border-b border-color'}>
          <div className={'text-lg font-medium'}>{title}</div>
        </header>
        <ul className="menu menu-compact bg-base-100 py-2 ">
          {menu.map(({ href, label }, i) => {
            return (
              <ActiveLink key={i} activeClassName={'bordered'} href={href}>
                <li>
                  <a href={href}>{label}</a>
                </li>
              </ActiveLink>
            );
          })}
        </ul>
      </aside>
      <main className={'flex-1 relative h-full overflow-auto'}>
        <div className={'absolute inset-0 scrollbar-thin'}>{children}</div>
      </main>
    </div>
  );
};
