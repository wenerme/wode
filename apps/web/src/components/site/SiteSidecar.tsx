'use client';

import React, { memo, useEffect, useMemo, useState, type ComponentPropsWithoutRef } from 'react';
import { HiMiniArrowsPointingIn } from 'react-icons/hi2';
import { PiBrowser, PiBrowsersLight, PiCaretLeftLight, PiCaretRightLight } from 'react-icons/pi';
import { VscClose, VscCloseAll, VscPrimitiveSquare } from 'react-icons/vsc';
import { FloatingFocusManager, FloatingPortal, useTransitionStyles } from '@floating-ui/react';
import * as LocaleMatcher from '@formatjs/intl-localematcher';
import { cn } from '@wener/console';
import { DaisyTheme } from '@wener/console/daisy';
import { usePopover } from '@wener/console/floating';
import { useExposeDebug } from '@wener/console/hooks';
import { WebVitals } from '@wener/console/web';
import { getRootWindow, Window, type ReactWindow } from '@wener/console/window';
import { ClientOnly, DevOnly, useDebugRender, useEventListener } from '@wener/reaction';
import { clsx } from 'clsx';
import { parse as parseCookie } from 'cookie';
import { throttle } from 'es-toolkit';
import { useSearchParams } from 'next/navigation';
import { shallow } from 'zustand/shallow';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { getI18nStore } from '@/i18n/loadI18n';
import { loadMessage } from '@/i18n/loadMessage';
import { resolveClientLocale } from '@/i18n/resolveClientLocale';

export const SiteSidecar = () => {
  useDebugRender({ name: 'SiteSidecar' });
  useExposeDebug({
    ReactWindow: Window,
  });
  useRefreshScrollRestoration();
  useState(() => {
    // polyfill for testing
    (Intl as any).LocaleMatcher ||= LocaleMatcher;
    console.log(`polyfill Intl.LocaleMatcher`, (Intl as any).LocaleMatcher);
    return {};
  });

  //
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState(false);
  useEffect(() => {
    // 第一次出现窗口时自动打开
    if (initial) return;
    return Window.getRoot().store.subscribe((s) => {
      if (s.windows.length) {
        setInitial(true);
        setOpen(true);
      }
    });
  }, [initial]);

  return (
    <ClientOnly>
      <DaisyTheme.Sidecar />
      <Window.Host />
      <WebVitals />
      <LocaleSidecar />
      <aside
        className={clsx(
          'fixed bg-base-100',
          //
          'flex items-center',
          'order-1 border-b px-2',
          // small
          'h-[57px] w-full border-b',
          open ? 'top-0' : '-top-40',
          'transition-[top,right]',
          // md
          'md:top-0 md:py-4',
          open ? 'md:right-0' : 'md:-right-40',
          'md:order-6 md:h-full md:w-[57px] md:flex-col md:border-b-0 md:border-l md:px-0',
        )}
      >
        <div className={'relative flex h-full w-full flex-1 flex-row items-center gap-1 md:flex-col'}>
          <WindowControl />
          <div className={'relative h-full w-full flex-1'}>
            <div className={'absolute inset-0 overflow-x-auto md:overflow-y-auto md:overflow-x-hidden'}>
              <WindowDocks />
            </div>
          </div>
        </div>
      </aside>
      <div
        className={
          'fixed bottom-4 right-1.5 flex flex-col gap-2 overflow-hidden rounded-full border bg-base-100 px-1 py-1 shadow-lg'
        }
      >
        <button
          type={'button'}
          className={'btn btn-circle btn-sm'}
          onClick={() => {
            setOpen(!open);
          }}
        >
          {open ? <PiCaretRightLight /> : <PiCaretLeftLight />}
        </button>
        <DevOnly>
          <button
            type={'button'}
            className={'btn btn-circle btn-sm'}
            onClick={() => {
              console.log(`OpenWindow`, Window.getRoot());
              Window.open({
                title: 'Test',
                render: () => {
                  return <div>Hello</div>;
                },
              });
            }}
          >
            T1
          </button>
        </DevOnly>
      </div>
    </ClientOnly>
  );
};

const getLangCookie = () => parseCookie(document.cookie)['lang'] || '';
const LocaleSidecar = () => {
  const store = getI18nStore();
  const { i18n } = store.getState();
  let query = useSearchParams().get('lang') || '';
  const [cookie, setCookie] = useState(getLangCookie);
  useEventListener(
    (window as any).cookieStore as EventTarget,
    {
      change: () => {
        setCookie(getLangCookie());
      },
    },
    [],
  );
  useEffect(() => {
    const { locale } = resolveClientLocale({ cookie, query });
    if (locale === i18n.locale) {
      return;
    }
    console.log(`[LocaleSidecar] change locale ${i18n.locale} -> ${locale} query=${query}`);
    Promise.resolve(loadMessage(locale)).then((messages) => {
      i18n.loadAndActivate({ messages, locale });
    });
  }, [query, cookie]);
  return null;
};

function useRefreshScrollRestoration() {
  // handle refresh scroll restoration

  // alternative https://github.com/RevoTale/next-scroll-restorer
  // https://github.com/vercel/next.js/discussions/33777#discussioncomment-2148021
  useEffect(() => {
    const pageAccessedByReload = window.performance
      .getEntriesByType('navigation')
      .map((nav: any) => nav?.type)
      .includes('reload');

    if (pageAccessedByReload) {
      const scrollPosition = Number.parseInt(sessionStorage.getItem('scrollPosition') || '0', 10);
      if (scrollPosition) {
        window.scrollTo(0, scrollPosition);
      }
    }

    const handleScroll = throttle(() => {
      sessionStorage.setItem('scrollPosition', String(window.scrollY));
    }, 500);

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
}

const WindowControlPopoverContent: React.FC<ComponentPropsWithoutRef<'ul'>> = (props) => {
  const root = getRootWindow();
  // 避免单次操作内 layout 发生变化
  const top = useMemo(() => root.top, []);
  const count = root.windows.length;
  return (
    <ul className={'border-color menu menu-sm w-44 rounded-box border bg-base-100'} {...props}>
      {top && (
        <>
          <li className='menu-title'>当前窗口</li>
          <li>
            <a
              onClick={() => {
                top.close();
              }}
            >
              <VscClose />
              关闭
            </a>
          </li>
          <li>
            <a
              onClick={() => {
                top.center();
              }}
            >
              <VscPrimitiveSquare />
              居中
            </a>
          </li>
        </>
      )}
      <li className='menu-title'>窗口管理 ({count})</li>
      <li>
        <a
          onClick={() => {
            Window.closeAll();
          }}
        >
          <VscCloseAll />
          关闭所有窗口
        </a>
      </li>
      <li>
        <a
          onClick={() => {
            Window.minimizeAll();
          }}
        >
          <HiMiniArrowsPointingIn />
          最小化所有窗口
        </a>
      </li>
    </ul>
  );
};

const WindowControl = memo(() => {
  const { refs, getFloatingProps, getReferenceProps, open, setOpen, floatingStyles, context, nodeId } = usePopover({
    placement: 'left-start',
  });
  const { isMounted, styles } = useTransitionStyles(context, {
    initial: {
      opacity: 0,
      transform: 'translateY(-10px)',
    },
    close: {
      opacity: 0,
      transform: 'translateY(10px)',
    },
  });
  return (
    <>
      <button
        type={'button'}
        className={'btn btn-square btn-ghost btn-sm self-center'}
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        <PiBrowsersLight className={'h-5 w-5 opacity-75'} />
      </button>
      {isMounted && (
        <FloatingFocusManager context={context}>
          <div ref={refs.setFloating} {...getFloatingProps()} style={floatingStyles} className={'z-50'}>
            <WindowControlPopoverContent
              style={styles}
              onClick={() => {
                setOpen(false);
              }}
            />
          </div>
        </FloatingFocusManager>
      )}
    </>
  );
});

const WindowDock = memo<{ win: ReactWindow }>(({ win }) => {
  const iconClass = 'w-8 h-8 ';

  const { minimized, icon, title } = useStoreWithEqualityFn(
    win.store,
    ({ minimized, icon, title }) => {
      if (React.isValidElement(icon)) {
        icon = React.cloneElement(icon, {
          className: iconClass,
        } as any);
      }
      return { minimized, icon, title };
    },
    shallow,
  );
  const { refs, open, context, floatingStyles, getFloatingProps, getReferenceProps } = usePopover({
    hover: true,
    placement: 'left',
  });
  return (
    <>
      <button
        type={'button'}
        className={cn(
          'h-10 w-10',
          `flex items-center justify-center text-base-content hover:text-base-content`,
          'rounded bg-base-200',
          !minimized ? `active bg-base-300` : 'opacity-75',
        )}
        {...getReferenceProps()}
        onClick={() => {
          win.minimize();
        }}
        ref={refs.setReference}
      >
        {icon ?? <PiBrowser className={iconClass} />}
      </button>
      {open && (
        <FloatingPortal>
          <FloatingFocusManager context={context}>
            <div
              className={'rounded bg-base-200 p-1 text-xs opacity-85'}
              ref={refs.setFloating}
              {...getFloatingProps()}
              style={floatingStyles}
            >
              {title}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
});
const WindowDocks = memo(() => {
  const windows = useStoreWithEqualityFn(getRootWindow().store, (s) => s.windows, shallow);
  return (
    <div className={'flex h-full flex-row items-center gap-0.5 md:flex-col'}>
      {windows.map((win) => {
        return <WindowDock key={win.id} win={win} />;
      })}
    </div>
  );
});
