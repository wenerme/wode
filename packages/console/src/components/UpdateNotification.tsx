'use client';

import React, { useId } from 'react';
import { createPortal } from 'react-dom';
import { useMounted } from '@wener/reaction';

export const UpdateNotification: React.FC<UpdateNotificationProps> = (props) => {
  let id = useId();
  let mounted = useMounted();
  if (!mounted) {
    return null;
  }
  // https://github.com/GreatAuk/plugin-web-update-notification/blob/master/packages/core/src/shim.d.ts

  const {
    title,
    description,
    open,
    refreshButtonText,
    dismissButtonText,
    onRefresh = () => {
      location.reload();
    },
    onOpenChange,
  } = Object.assign({}, props, Locals.zh_CN);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className='toast toast-end bg-base-100 rounded shadow mr-4 mb-4'>
      <h3>{title}</h3>
      <p>{description}</p>
      <div className={'flex gap-4 justify-end'}>
        {onOpenChange && (
          <button type={'button'} className={'btn btn-sm btn-ghost'} onClick={() => onOpenChange?.(false)}>
            {dismissButtonText}
          </button>
        )}
        <button type={'button'} className={'btn btn-sm btn-primary'} onClick={onRefresh}>
          {refreshButtonText}
        </button>
      </div>
    </div>,
    document.body,
    id,
  );
};

export interface UpdateNotificationProps {
  title?: string;
  description?: string;
  refreshButtonText?: string;
  dismissButtonText?: string;
  onRefresh?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Locals = {
  zh_CN: {
    title: '发现新版本',
    description: '网页更新啦！请刷新页面后使用。',
    refreshButtonText: '刷新',
    dismissButtonText: '忽略',
  },
};
