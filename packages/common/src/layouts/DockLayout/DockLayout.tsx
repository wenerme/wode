import type { ReactNode } from 'react';
import React, { memo } from 'react';
import classNames from 'classnames';
import { DockClock } from './DockClock';
import { DockUserAvatar } from './DockUserAvatar';

export const DockLayout: React.FC<{ children?: ReactNode; dock?: ReactNode }> = ({ children, dock = <Dock /> }) => {
  return (
    <div className={classNames('flex h-screen w-full overflow-hidden', 'flex-col md:flex-row')}>
      <main className={'flex-1 relative h-full overflow-auto order-5'}>
        <div className={'absolute inset-0 scrollbar-thin'}>{children}</div>
      </main>
      <aside
        className={classNames(
          'flex items-center border-color',
          'w-full order-1 border-b px-2',
          'md:w-auto md:order-6 md:border-b-0 md:border-l md:px-0 md:w-[57px] md:flex-col',
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
      <header className={'py-1 flex flex-col gap-1 items-center'}>
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
