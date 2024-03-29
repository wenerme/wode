import React, { type ReactNode } from 'react';
import { HiCheck } from 'react-icons/hi';
import { ImLab } from 'react-icons/im';
import dayjs from 'dayjs';
import { useImmer } from 'use-immer';
import { useWindowEventListener } from '@wener/reaction';
import { Button } from '../../daisy';
import { getPrefersColorSchema } from '../../daisy/theme';
import { type BuildInfo, getBuildInfo } from '../../runtime';
import { getSiteConf, SystemLogo } from './index';

export const SystemAbout: React.FC<{ children?: ReactNode }> = ({ children }) => {
  return (
    <div className={'mx-auto mt-8 flex max-w-prose flex-col gap-8'}>
      <AppBuildInfo info={getBuildInfo()} title={getSiteConf().title} />
      <AuthorInfo />
      <ClientBrowserInfo />
      {children}
    </div>
  );
};

const AuthorInfo = () => {
  const {
    title,
    author: { name, link },
  } = getSiteConf();
  return (
    <div className={'rounded-lg border p-4 text-sm shadow'}>
      <article className={'prose'}>
        <p>{title}</p>
        <small>
          由{' '}
          <Button href={link} size={'xs'} className={'btn-link'} target={'_blank'}>
            {name}
          </Button>{' '}
          提供技术支持。
        </small>
      </article>
    </div>
  );
};

const AppBuildInfo: React.FC<{ logo?: ReactNode; title?: ReactNode; info: BuildInfo }> = ({ logo, title, info }) => {
  return (
    <div className={'rounded-lg border shadow'}>
      <ul className={'flex flex-col divide-y divide-color [&>li]:flex [&>li]:items-center [&>li]:gap-2 [&>li]:p-3'}>
        <li>
          {logo || <SystemLogo className={'w-6 h-6'} />}
          <span className={'text-xl font-medium'}>{title}</span>
        </li>
        <li>
          <div className={'flex h-8 w-8 items-center justify-center'}>
            <HiCheck className={'h-4 w-4 text-info'} />
          </div>
          <div>
            <div className={'flex items-center gap-2'}>
              当前版本: {info.version}
              {info.isDev && (
                <span className={'badge badge-warning'}>
                  <ImLab /> 测试版本
                </span>
              )}
            </div>
            <div className={'flex gap-2'}>
              <small className={'text-gray-600'}>构建于 {dayjs(info.date).format('YYYY.MM.DD HH.mm')}</small>
              {info.commit.shortSha && (
                <small className={'text-gray-300'}>
                  {info.commit.shortSha}
                  {info.commit.timestamp && <span>@{dayjs(info.commit.timestamp).format()}</span>}
                </small>
              )}
            </div>
          </div>
        </li>
      </ul>
    </div>
  );
};

const ClientBrowserInfo = () => {
  const getState = () => ({
    ua: globalThis.navigator?.userAgent,
    width: globalThis.outerWidth,
    height: globalThis.outerHeight,
    dpr: globalThis.devicePixelRatio,
    screenWidth: globalThis.screen?.width,
    screenHeight: globalThis.screen?.height,
  });
  const [state, update] = useImmer(getState);
  useWindowEventListener(
    {
      resize: () => {
        update(getState());
      },
    } as any,
    [],
  );
  return (
    <div className={'rounded-lg border p-4 text-sm shadow'}>
      <article className={'prose'}>
        <p>当前客户端系统信息</p>
        <div className={'flex flex-col'}>
          <small>
            窗口: {state.width}x{state.height} <br />
            屏幕: {state.screenWidth}x{state.screenHeight} @{state.dpr}x <br />
          </small>
          <small>{state.ua}</small>
          <details>
            <summary className={'text-sm btn-link'}>更多信息</summary>
            <small>
              偏好主题: {getPrefersColorSchema()} <br />
              语言: {navigator.language}
            </small>
          </details>
        </div>
      </article>
    </div>
  );
};
