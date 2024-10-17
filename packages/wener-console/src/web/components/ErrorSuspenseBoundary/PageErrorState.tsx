import type { FC, ReactNode } from 'react';
import { HiArrowLeft, HiArrowPath, HiHome, HiOutlineExclamationCircle } from 'react-icons/hi2';
import { useInRouterContext, useNavigate, useRouteError } from 'react-router-dom';
import { Button, NonIdealState } from '../../../daisy';

export const PageErrorState: FC<{ error?: any; onReset?: () => void; title?: ReactNode }> = ({
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
          {onReset && (
            <Button
              className={'btn-outline btn-sm'}
              onClick={() => {
                onReset();
              }}
            >
              <HiArrowPath className={'h-4 w-4'} />
              重置
            </Button>
          )}
          <Button
            className={'btn-outline btn-sm'}
            onClick={() => {
              navigate('/');
            }}
          >
            <HiHome className={'h-4 w-4'} />
            首页
          </Button>
          <Button
            className={'btn-outline btn-sm'}
            onClick={() => {
              navigate(-1);
            }}
          >
            <HiArrowLeft className={'h-4 w-4'} />
            返回
          </Button>
          <Button
            className={'btn-outline btn-sm'}
            onClick={() => {
              window.location.reload();
            }}
          >
            <HiArrowPath className={'h-4 w-4'} />
            刷新
          </Button>
        </div>
      }
    />
  );
};
