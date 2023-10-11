import type { ReactNode } from 'react';
import React, { memo } from 'react';
import classNames from 'clsx';
import { DockClock } from './DockClock';
import { DockUserAvatar } from './DockUserAvatar';

export const DockLayout: React.FC<{ children?: ReactNode; dock?: ReactNode }> = ({ children, dock = <Dock /> }) => {
  return (
    <div className={classNames('flex h-screen w-full overflow-hidden', 'flex-col md:flex-row')}>
      <main className={'relative order-5 h-full flex-1 overflow-auto'}>
        <div className={'scrollbar-thin absolute inset-0'}>{children}</div>
      </main>
      <aside
        className={classNames(
          'border-color flex items-center',
          'order-1 w-full border-b px-2',
          'md:order-6 md:w-[57px] md:w-auto md:flex-col md:border-b-0 md:border-l md:px-0',
        )}
      >
        {dock}
      </aside>
    </div>
  );
};

const Dock = memo(() => {
  return (
    <>
      <header className={'flex flex-col items-center gap-1 py-1'}>
        <DockUserAvatar />
      </header>
      <div className={'flex flex-1'}></div>
      <footer className={'flex flex-col items-center'}>
        <DockClock />
      </footer>
    </>
  );
});

Dock.displayName = 'Dock';
