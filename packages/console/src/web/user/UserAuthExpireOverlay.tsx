import React, { useEffect, useState } from 'react';
import { HiMiniArrowPath, HiOutlineNoSymbol, HiMiniArrowRightOnRectangle as LoginIcon } from 'react-icons/hi2';
import clsx from 'clsx';
import { useSnapshot } from 'valtio';
import { Button, NonIdealState } from '../../daisy';
import { getUserAction } from './getUserAction';
import { getUserSessionState } from './getUserSessionState';

export const UserAuthExpireOverlay = () => {
  const { signIn } = getUserAction();
  const { expired } = useSnapshot(getUserSessionState());
  const [hidden, setHidden] = useState(!expired);
  useEffect(() => {
    if (expired) {
      setHidden(false);
    }
  }, [expired]);
  if (hidden) {
    return null;
  }
  return (
    <div
      className={clsx(
        'absolute inset-0 z-50 flex items-center justify-center',
        'transition duration-500',
        expired ? 'opacity-100 backdrop-blur-sm' : 'pointer-events-none opacity-0 backdrop-blur-none',
        hidden && !expired && 'hidden',
      )}
      onAnimationEnd={() => {
        if (!expired) {
          setHidden(true);
        }
      }}
    >
      <div className={'rounded border-base-200 bg-base-100 px-8 py-4 shadow-xl'}>
        <NonIdealState
          icon={<HiOutlineNoSymbol className='h-12 w-12' />}
          title={'登陆失效'}
          description={'请尝试重新登陆或刷新页面'}
          action={
            <div className={'flex gap-2 opacity-95'}>
              <Button className={'btn-success btn-sm'} onClick={signIn}>
                <LoginIcon className={'h-4 w-4'} />
                登陆
              </Button>
              <Button
                className={'btn-outline btn-sm'}
                onClick={() => {
                  window.location.reload();
                }}
              >
                <HiMiniArrowPath className={'h-4 w-4'} />
                刷新
              </Button>
            </div>
          }
        />
      </div>
    </div>
  );
};
