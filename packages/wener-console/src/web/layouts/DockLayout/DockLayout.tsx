import type { ReactNode } from 'react';
import type React from 'react';
import { memo } from 'react';
import { HiOutlineLogout } from 'react-icons/hi';
import { HiLockClosed, HiOutlineIdentification, HiQuestionMarkCircle } from 'react-icons/hi2';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { useStore } from 'zustand';
import { getConsoleStore, getUserStore } from '../../../console/container';
import { getUserAction } from '../../../console/user';
import { isDev } from '../../../const';
import { DockClock } from './DockClock';
import { DockUserAvatar } from './DockUserAvatar';

export const DockLayout: React.FC<{ children?: ReactNode; dock?: ReactNode }> = ({ children, dock = <Dock /> }) => {
  return (
    <div className={clsx('flex h-screen w-full overflow-hidden', 'flex-col md:flex-row')}>
      <main className={'relative order-5 h-full flex-1 overflow-auto'}>
        <div className={'scrollbar-thin absolute inset-0'}>{children}</div>
      </main>
      <aside
        className={clsx(
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

const UserAvatar = () => {
  const { id, loginName, fullName, photoUrl, avatarUrl = photoUrl } = useStore(getUserStore());
  const hasNotification = false;
  const { signOut, signIn, lock, refreshProfile } = getUserAction();
  return (
    <DockUserAvatar {...{ loginName, fullName, avatarUrl, hasNotification, onSignIn: signIn, onSignOut: signOut }}>
      <Link to={`/user/${id}`} type={'button'} className={'btn btn-ghost flex h-auto w-full flex-col items-start py-2'}>
        <div className={'text-lg font-medium'}>{fullName}</div>
        <div className={'flex items-baseline justify-between gap-4'}>
          {loginName && (
            <small title={'登录名'} className={'opacity-75'}>
              @{loginName}
            </small>
          )}
        </div>
      </Link>
      <hr className={'my-2 border-base-200'} />
      <ul className={'menu p-2'}>
        <li key={'refreshProfile'}>
          <button type={'button'} onClick={refreshProfile}>
            <HiOutlineIdentification />
            刷新个人信息
          </button>
        </li>
        <li>
          <button type={'button'} onClick={lock}>
            <HiLockClosed />
            锁定
          </button>
        </li>
        <li>
          <button type={'button'} onClick={signOut}>
            <HiOutlineLogout />
            退出登录
          </button>
        </li>
        {isDev() && (
          <li>
            <button
              type={'button'}
              onClick={() => {
                getConsoleStore().setState({ expired: true });
              }}
            >
              <HiQuestionMarkCircle />
              登录失效
            </button>
          </li>
        )}
      </ul>
    </DockUserAvatar>
  );
};

const Dock = memo(() => {
  return (
    <>
      <header className={'flex flex-col items-center gap-1 py-1'}>
        <UserAvatar />
      </header>
      <div className={'flex flex-1'}></div>
      <footer className={'flex flex-col items-center'}>
        <DockClock />
      </footer>
    </>
  );
});

Dock.displayName = 'Dock';
