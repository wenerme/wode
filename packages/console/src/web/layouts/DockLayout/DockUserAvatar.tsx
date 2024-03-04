import type { ReactNode } from 'react';
import React from 'react';
import { HiUsers } from 'react-icons/hi2';
import { Popover, Transition } from '@headlessui/react';
import { clsx } from 'clsx';
import { Button } from '../../../daisy';

export interface DockUserAvatarProps {
  hasNotification?: boolean;
  onSignIn?: () => void;
  onSignOut?: () => void;
  fullName?: string;
  loginName?: string;
  avatarUrl?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export const DockUserAvatar: React.FC<DockUserAvatarProps> = ({
  hasNotification,
  fullName,
  loginName,
  avatarUrl,
  onSignIn,
  onSignOut,
  actions,
  children,
}) => {
  if (!loginName) {
    return (
      <Button size={'md'} ghost circle className={'opacity-80'} onClick={onSignIn}>
        <HiUsers className={'h-6 w-6'} />
        <small className={'text-xs'}>未登录</small>
      </Button>
    );
  }

  return (
    <Popover className='relative'>
      {({ open }) => (
        <>
          <Popover.Button type={'button'} className={clsx('btn btn-circle btn-ghost btn-md p-0', open && 'btn-active')}>
            <div className={clsx('avatar', !avatarUrl && 'placeholder', hasNotification && 'online')}>
              {avatarUrl ? (
                <div className='w-10 rounded-full'>
                  <img alt={fullName || 'user avatar'} src={avatarUrl} />
                </div>
              ) : (
                <div className='w-10 rounded-full bg-neutral-focus text-neutral-content'>{fullName?.slice(0, 1)}</div>
              )}
            </div>
          </Popover.Button>
          <Transition
            as={React.Fragment}
            enter='transition ease-out duration-200'
            enterFrom='opacity-0 translate-y-1'
            enterTo='opacity-100 translate-y-0'
            leave='transition ease-in duration-150'
            leaveFrom='opacity-100 translate-y-0'
            leaveTo='opacity-0 translate-y-1'
          >
            <Popover.Panel className='absolute right-full top-0 z-10 mr-2 w-[180px] '>
              <div className='overflow-hidden rounded-lg bg-base-100/50 p-3 shadow-lg ring-1 ring-black ring-opacity-5 backdrop-blur'>
                {children}
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
};
