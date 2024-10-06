import type React from 'react';
import type { ReactNode } from 'react';
import { GrSystem } from 'react-icons/gr';
import { HiCheck } from 'react-icons/hi';
import { ImLab } from 'react-icons/im';
import { useWindowEventListener } from '@wener/reaction';
import dayjs from 'dayjs';
import { useImmer } from 'use-immer';
import type { BuildInfo } from '../../../buildinfo';
import { getBuildInfo } from '../../../buildinfo';
import { Button } from '../../../daisy';
import { useUserAgentPreferences } from '../../../utils/UserAgentPreference';
import { SiteLogo } from '../../components';

export const SystemAboutPage: React.FC<{
  title?: string;
  children?: ReactNode;
  logo?: ReactNode;
  build?: {
    title?: string;
    info?: BuildInfo;
  };
  author?: {
    title?: string;
    author?: {
      name?: string;
      link?: string;
    };
  };
  agent?: ReactNode;
}> = ({
  children,
  title = '控制台',
  logo = <SiteLogo className={'h-6 w-6'} />,
  build = {
    title: title,
    info: getBuildInfo(),
  },
  author = {
    title: title,
  },
  agent,
}) => {
  return (
    <div className={'mx-auto mt-8 flex max-w-prose flex-col gap-8'}>
      <AppBuildInfo logo={logo} info={build.info || getBuildInfo()} title={title} />
      <AuthorInfo {...author} />
      {agent ?? <ClientBrowserInfo />}
      {children}
    </div>
  );
};

const AuthorInfo: React.FC<{ title?: string; author?: { name?: string; link?: string } }> = (props) => {
  const { title = '控制台', author: { name = 'Wener', link = 'https://wener.me' } = {} } = props;
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
      <ul className={'divide-color flex flex-col divide-y [&>li]:flex [&>li]:items-center [&>li]:gap-2 [&>li]:p-3'}>
        <li>
          {logo || <GrSystem className={'h-6 w-6'} />}
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
    screenWidth: globalThis.screen?.width,
    screenHeight: globalThis.screen?.height,
    timezone: Intl.DateTimeFormat?.().resolvedOptions?.()?.timeZone,
  });
  const [state, update] = useImmer(getState);
  useWindowEventListener(
    {
      resize: () => {
        update(getState());
      },
    },
    [],
  );
  const { colorTheme, devicePixelRatio, reducedTransparency, reducedData, reducedMotion, contrast } =
    useUserAgentPreferences();
  return (
    <div className={'rounded-lg border p-4 text-sm shadow'}>
      <article className={'prose'}>
        <p>当前客户端系统信息</p>
        <div className={'flex flex-col'}>
          <small>
            窗口: {state.width}×{state.height} <br />
            屏幕: {state.screenWidth}×{state.screenHeight} @{devicePixelRatio}x <br />
          </small>
          <small>{state.ua}</small>
          <details>
            <summary className={'btn-link text-sm'}>更多信息</summary>
            <small>
              <div>偏好主题: {colorTheme}</div>
              <div>语言: {navigator.language}</div>
              <div>时区: {state.timezone}</div>
              <div>设备像素比: {devicePixelRatio}</div>
              <div>对比度: {contrast}</div>
              <div>
                {[
                  reducedData && 'Reduced Data',
                  reducedMotion && 'Reduced Motion',
                  reducedTransparency && 'Reduced Transparency',
                ]
                  .filter(Boolean)
                  .join(' ')}
              </div>
            </small>
          </details>
        </div>
      </article>
    </div>
  );
};
