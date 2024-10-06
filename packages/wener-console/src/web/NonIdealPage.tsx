import type { ReactNode } from 'react';
import type React from 'react';
import { BiError } from 'react-icons/bi';
import { GrDocumentMissing } from 'react-icons/gr';
import { HiMiniArrowLeft, HiMiniArrowPath, HiMiniHome } from 'react-icons/hi2';
import { useInRouterContext, useNavigate } from 'react-router-dom';
import { Button, NonIdealState } from '../daisy';

export const NonIdealPage: React.FC<{ icon?: ReactNode; title?: ReactNode; description?: ReactNode }> = ({
  title,
  icon,
  description,
}) => {
  const inRouterContext = useInRouterContext();
  let navigate = (v: any) => {
    typeof v === 'string' ? (window.location.href = v) : window.history.back();
  };
  if (inRouterContext) {
    navigate = useNavigate();
  }

  return (
    <div className={'flex h-full flex-1 items-center justify-center'}>
      <NonIdealState
        icon={icon}
        title={title}
        description={description}
        action={
          <div className={'flex gap-2 opacity-95'}>
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
      ></NonIdealState>
    </div>
  );
};

export const NotFoundPage = () => {
  return (
    <NonIdealPage
      icon={<GrDocumentMissing className={'h-12 w-12'} />}
      title={'页面不存在'}
      description={<small suppressHydrationWarning>当前页面地址: {globalThis.location?.href}</small>}
    />
  );
};

export const ServerErrorPage: React.FC<{ statusCode?: string }> = ({ statusCode }) => {
  return (
    <NonIdealPage
      icon={<BiError className={'h-12 w-12'} />}
      title={`服务器处理错误`}
      description={<small>错误码：{statusCode || '未知'}</small>}
    />
  );
};
