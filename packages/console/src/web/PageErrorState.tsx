import React from 'react';
import { HiMiniArrowLeft, HiMiniArrowPath, HiMiniHome, HiOutlineExclamationCircle } from 'react-icons/hi2';
import { useInRouterContext, useNavigate, useRouteError } from 'react-router-dom';
import { Button, NonIdealState } from '../daisy';

export const PageErrorState: React.FC<{ error?: any; reset?: () => void; title?: string }> = ({
  error,
  reset,
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
      icon={<HiOutlineExclamationCircle className={'h-12 w-12'} />}
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
          {reset && (
            <Button
              className={'btn-outline btn-sm'}
              onClick={() => {
                reset();
              }}
            >
              <HiMiniArrowPath className={'h-4 w-4'} />
              重置
            </Button>
          )}
          <Button
            className={'btn-outline btn-sm'}
            onClick={() => {
              navigate('/');
            }}
          >
            <HiMiniHome className={'h-4 w-4'} />
            首页
          </Button>
          <Button
            className={'btn-outline btn-sm'}
            onClick={() => {
              navigate(-1);
            }}
          >
            <HiMiniArrowLeft className={'h-4 w-4'} />
            返回
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
  );
};
