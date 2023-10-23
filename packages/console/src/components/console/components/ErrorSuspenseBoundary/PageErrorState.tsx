import React, { ReactNode } from 'react';
import { HiArrowLeft, HiArrowPath, HiHome, HiOutlineExclamationCircle } from 'react-icons/hi2';
import { useInRouterContext, useNavigate, useRouteError } from 'react-router-dom';
import { Button, NonIdealState } from '../../../daisy';

export const PageErrorState: React.FC<{ error?: any; onReset?: () => void; title?: ReactNode }> = ({
  error,
  onReset,
  title = '页面出错啦!',
}) => {
  const inRouterContext = useInRouterContext();
  let navigate = (v: any) => {
    typeof v === 'string' ? (window.location.href = v) : window.history.back();
  };
  if (inRouterContext) {
    navigate = useNavigate();
    const routerError = useRouteError();
    error ||= routerError;
  }

  return (
    <NonIdealState
      icon={<HiOutlineExclamationCircle className={'w-12 h-12'} />}
      title={title}
      description={
        <div>
          <div>请联系管理员或刷新页面</div>
          <details>
            <summary>查看详细错误</summary>
            <pre>{String(error)}</pre>
          </details>
        </div>
      }
      action={
        <div className={'flex gap-2 opacity-95'}>
          {onReset && (
            <Button
              className={'btn-sm btn-outline'}
              onClick={() => {
                onReset();
              }}
            >
              <HiArrowPath className={'w-4 h-4'} />
              重置
            </Button>
          )}
          <Button
            className={'btn-sm btn-outline'}
            onClick={() => {
              navigate('/');
            }}
          >
            <HiHome className={'w-4 h-4'} />
            首页
          </Button>
          <Button
            className={'btn-sm btn-outline'}
            onClick={() => {
              navigate(-1);
            }}
          >
            <HiArrowLeft className={'w-4 h-4'} />
            返回
          </Button>
          <Button
            className={'btn-sm btn-outline'}
            onClick={() => {
              window.location.reload();
            }}
          >
            <HiArrowPath className={'w-4 h-4'} />
            刷新
          </Button>
        </div>
      }
    />
  );
};
