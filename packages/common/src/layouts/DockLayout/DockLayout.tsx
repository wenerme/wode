import type { ReactNode } from 'react';
import React, { memo } from 'react';
import { DockClock } from './DockClock';
import { DockUserAvatar } from './DockUserAvatar';

export const DockLayout: React.FC<{ children?: ReactNode; dock?: ReactNode }> = ({ children, dock = <Dock /> }) => {
  return (
    <div className={'flex h-screen w-full overflow-hidden'}>
      <main className={'flex-1 relative h-full overflow-auto'}>
        <div className={'absolute inset-0 scrollbar-thin'}>{children}</div>
      </main>
      <div className={'w-[57px] border-l flex flex-col items-center'}>{dock}</div>
    </div>
  );
};

const Dock = memo(() => {
  return (
    <>
      <header className={'py-1 flex flex-col gap-1 items-center'}>
        <DockUserAvatar />
      </header>
      <div className={'flex-1'}></div>
      <footer className={'flex flex-col items-center'}>
        <DockClock />
      </footer>
    </>
  );
});

Dock.displayName = 'Dock';
