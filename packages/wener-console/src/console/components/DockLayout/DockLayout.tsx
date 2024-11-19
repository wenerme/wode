import React, { memo, useMemo, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { HiOutlineLogout } from 'react-icons/hi';
import { HiLockClosed, HiMiniArrowsPointingIn, HiOutlineIdentification, HiQuestionMarkCircle } from 'react-icons/hi2';
import { PiBrowser, PiBrowsersLight } from 'react-icons/pi';
import { VscClose, VscCloseAll, VscPrimitiveSquare } from 'react-icons/vsc';
import { Link } from 'react-router-dom';
import { FloatingFocusManager, FloatingPortal, useTransitionStyles } from '@floating-ui/react';
import { getUserStore } from '@wener/console/console';
import { getUserAction } from '@wener/console/console/user';
import { usePopover } from '@wener/console/floating';
import { cn } from '@wener/console/tw';
import { getRootWindow, Window, type ReactWindow } from '@wener/console/web/window';
import clsx from 'clsx';
import { useStore } from 'zustand';
import { shallow } from 'zustand/shallow';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { isDev } from '@/const';
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
                // getUserSessionState().expired = true;
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
      <div className={'relative flex w-full flex-1 flex-col gap-1'}>
        <WindowControl />
        <div className={'relative w-full flex-1'}>
          <div className={'absolute inset-0 overflow-y-auto'}>
            <WindowDocks />
          </div>
        </div>
      </div>
      <footer className={'flex flex-col items-center'}>
        <DockClock />
      </footer>
    </>
  );
});

const WindowControlPopoverContent: React.FC<ComponentPropsWithoutRef<'ul'>> = (props) => {
  const root = getRootWindow();
  // 避免单次操作内 layout 发生变化
  const top = useMemo(() => root.top, []);
  const count = root.windows.length;
  return (
    <ul className={'border-color menu menu-sm w-44 rounded-box border bg-base-100'} {...props}>
      {top && (
        <>
          <li className='menu-title'>当前窗口</li>
          <li>
            <a
              onClick={() => {
                top.close();
              }}
            >
              <VscClose />
              关闭
            </a>
          </li>
          <li>
            <a
              onClick={() => {
                top.center();
              }}
            >
              <VscPrimitiveSquare />
              居中
            </a>
          </li>
        </>
      )}
      <li className='menu-title'>窗口管理 ({count})</li>
      <li>
        <a
          onClick={() => {
            Window.closeAll();
          }}
        >
          <VscCloseAll />
          关闭所有窗口
        </a>
      </li>
      <li>
        <a
          onClick={() => {
            Window.minimizeAll();
          }}
        >
          <HiMiniArrowsPointingIn />
          最小化所有窗口
        </a>
      </li>
    </ul>
  );
};
const WindowControl = memo(() => {
  const { refs, getFloatingProps, getReferenceProps, open, setOpen, floatingStyles, context, nodeId } = usePopover({
    placement: 'left-start',
  });
  const { isMounted, styles } = useTransitionStyles(context, {
    initial: {
      opacity: 0,
      transform: 'translateY(-10px)',
    },
    close: {
      opacity: 0,
      transform: 'translateY(10px)',
    },
  });
  return (
    <>
      <button
        type={'button'}
        className={'btn btn-square btn-ghost btn-sm self-center'}
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        <PiBrowsersLight className={'h-5 w-5 opacity-75'} />
      </button>
      {isMounted && (
        <FloatingFocusManager context={context}>
          <div ref={refs.setFloating} {...getFloatingProps()} style={floatingStyles} className={'z-50'}>
            <WindowControlPopoverContent
              style={styles}
              onClick={() => {
                setOpen(false);
              }}
            />
          </div>
        </FloatingFocusManager>
      )}
    </>
  );
});

const WindowDock = memo<{ win: ReactWindow }>(({ win }) => {
  const iconClass = 'w-8 h-8 ';

  const { minimized, icon, title } = useStoreWithEqualityFn(
    win.store,
    ({ minimized, icon, title }) => {
      if (React.isValidElement(icon)) {
        icon = React.cloneElement(icon, {
          className: iconClass,
        } as any);
      }
      return { minimized, icon, title };
    },
    shallow,
  );
  const { refs, open, context, floatingStyles, getFloatingProps, getReferenceProps } = usePopover({
    hover: true,
    placement: 'left',
  });
  return (
    <>
      <button
        type={'button'}
        className={cn(
          'h-10 w-10',
          `flex items-center justify-center text-base-content hover:text-base-content`,
          'rounded-lg bg-base-200',
          !minimized ? `active bg-base-300` : 'opacity-75',
        )}
        {...getReferenceProps()}
        onClick={() => {
          win.minimize();
        }}
        ref={refs.setReference}
      >
        {icon ?? <PiBrowser className={iconClass} />}
      </button>
      {open && (
        <FloatingPortal>
          <FloatingFocusManager context={context}>
            <div
              className={'rounded bg-base-200 p-1 text-xs opacity-85'}
              ref={refs.setFloating}
              {...getFloatingProps()}
              style={floatingStyles}
            >
              {title}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
});
const WindowDocks = memo(() => {
  const windows = useStoreWithEqualityFn(getRootWindow().store, (s) => s.windows, shallow);
  return (
    <div className={'flex flex-col items-center gap-0.5'}>
      {windows.map((win) => {
        return <WindowDock key={win.id} win={win} />;
      })}
    </div>
  );
});

Dock.displayName = 'Dock';
