import React, { ReactNode, useMemo, useState } from 'react';
import { BiError } from 'react-icons/bi';
import { GrDocumentMissing } from 'react-icons/gr';
import { useInRouterContext, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/20/solid';
import { Button, NonIdealState } from '../daisy';

export const NonIdealPage: React.FC<{ icon?: ReactNode; title?: ReactNode; description?: ReactNode }> = ({
  title,
  icon,
  description,
}) => {
  const inRouterContext = useInRouterContext();
  let navigate = (v: any) => (typeof v === 'string' ? (window.location.href = v) : window.history.back());
  if (inRouterContext) {
    navigate = useNavigate();
  }

  return (
    <div className={'h-full flex-1 flex items-center justify-center'}>
      <NonIdealState
        icon={icon}
        title={title}
        description={description}
        action={
          <div className={'flex gap-2 opacity-95'}>
            <Button className={'btn-sm btn-outline'} onClick={() => navigate('/')}>
              <HomeIcon className={'w-4 h-4'} />
              首页
            </Button>
            <Button className={'btn-sm btn-outline'} onClick={() => navigate(-1)}>
              <ArrowLeftIcon className={'w-4 h-4'} />
              返回
            </Button>
            <Button className={'btn-sm btn-outline'} onClick={() => window.location.reload()}>
              <ArrowPathIcon className={'w-4 h-4'} />
              刷新
            </Button>
          </div>
        }
      ></NonIdealState>
    </div>
  );
};

export const NotFoundPage = () => {
  return (
    <NonIdealPage
      icon={<GrDocumentMissing className={'w-12 h-12'} />}
      title={'页面不存在'}
      description={<small suppressHydrationWarning>当前页面地址: {globalThis.location?.href}</small>}
    />
  );
};
export const ServerErrorPage: React.FC<{ statusCode?: string }> = ({ statusCode }) => {
  return (
    <NonIdealPage
      icon={<BiError className={'w-12 h-12'} />}
      title={`服务器处理错误`}
      description={<small>错误码：{statusCode || '未知'}</small>}
    />
  );
};
