import React, { useEffect, useState } from 'react';
import { HiLockClosed, HiMiniLockOpen } from 'react-icons/hi2';
import clsx from 'clsx';
import { useSnapshot } from 'valtio';
import { Button, NonIdealState } from '../../daisy';
import { getUserAction } from './getUserAction';
import { getUserSessionState } from './getUserSessionState';

export const UserLockOverlay = () => {
  const { unlock } = getUserAction();
  const { expired, locked } = useSnapshot(getUserSessionState());
  const [hidden, setHidden] = useState(!expired);
  const [pin, setPin] = useState('');
  useEffect(() => {
    if (locked) {
      setPin(Math.random().toString().slice(-4));
      setHidden(false);
    }
  }, [locked]);
  if (hidden || expired) {
    return null;
  }
  return (
    <div
      className={clsx(
        'z-50 absolute inset-0 flex items-center justify-center',
        'transition duration-500',
        locked ? 'opacity-100 backdrop-blur-sm' : 'opacity-0 backdrop-blur-none pointer-events-none',
        hidden && !locked && 'hidden',
      )}
      onAnimationEnd={() => {
        if (!locked) {
          setHidden(true);
        }
      }}
    >
      <div className={'bg-base-100 rounded px-8 py-4 border-base-200 shadow-xl'}>
        <NonIdealState
          icon={<HiLockClosed className='w-12 h-12' />}
          title={
            <div className={'flex flex-col gap-1'}>
              <span>系统已锁定</span>
              <span>{pin}</span>
            </div>
          }
          description={'点击解锁进入系统'}
          action={
            <div className={'flex gap-2 opacity-95'}>
              <Button autoFocus className={'btn-sm btn-success'} onClick={unlock}>
                <HiMiniLockOpen className={'w-4 h-4'} />
                解锁
              </Button>
            </div>
          }
        />
      </div>
    </div>
  );
};
