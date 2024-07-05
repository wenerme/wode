import React from 'react';

export const MenuLayout: React.FC<{
  children?: React.ReactNode;
  title?: React.ReactNode;
  menu?: Array<{ href: string; label: string }>;
}> = ({ children, title, menu = [] }) => {
  return (
    <div className={'flex h-screen'}>
      <aside className={'border-color flex w-[200px] flex-col border-r'}>
        <header className={'border-color flex items-center border-b px-2 py-4'}>
          <div className={'text-lg font-medium'}>{title}</div>
        </header>
        <ul className='menu-compact menu bg-base-100 py-2'>
          {menu.map(({ href, label }, i) => {
            // fixme
            return (
              <a key={i} href={href}>
                <li>
                  <a href={href}>{label}</a>
                </li>
              </a>
            );
          })}
        </ul>
      </aside>
      <main className={'relative h-full flex-1 overflow-auto'}>
        <div className={'scrollbar-thin absolute inset-0'}>{children}</div>
      </main>
    </div>
  );
};
