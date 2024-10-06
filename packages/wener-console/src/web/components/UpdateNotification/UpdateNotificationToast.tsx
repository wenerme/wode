'use client';

import type React from 'react';
import { useId } from 'react';
import { createPortal } from 'react-dom';
import { useMounted } from '@wener/reaction';

export const UpdateNotificationToast: React.FC<UpdateNotificationToastProps> = (props) => {
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
  } = Object.assign({}, Locals.zh_CN, props);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className='toast toast-end isolate z-50 mb-4 mr-4 rounded bg-base-100 shadow'>
      <h3>{title}</h3>
      <p>{description}</p>
      <div className={'flex justify-end gap-4'}>
        {onOpenChange && (
          <button type={'button'} className={'btn btn-ghost btn-sm'} onClick={() => onOpenChange?.(false)}>
            {dismissButtonText}
          </button>
        )}
        <button type={'button'} className={'btn btn-primary btn-sm'} onClick={onRefresh}>
          {refreshButtonText}
        </button>
      </div>
    </div>,
    document.body,
    id,
  );
};

export interface UpdateNotificationToastProps {
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
