import { memo, useEffect, type ComponentPropsWithoutRef, type FC, type ReactNode } from 'react';
import { Rnd } from 'react-rnd';
import { Closer } from '@wener/utils';
import { clsx } from 'clsx';
import { useStore } from 'zustand';
import { shallow } from 'zustand/shallow';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { getRootWindow, WindowContext, type ReactWindow } from './ReactWindow';
import { WindowController } from './Window';
import { WindowFrame } from './WindowFrame';

export const WindowGuest = memo<{ win: ReactWindow }>(({ win }) => {
  const { store } = win;
  const [zIndex, minimized, x, y, width, height, canResize, canDrag, minWidth, minHeight, maxWidth, maxHeight] =
    useStore(
      store,
      ({
        zIndex,
        minimized,
        x,
        y,
        width,
        height,
        canResize,
        maximized,
        canDrag,
        minWidth,
        minHeight,
        maxWidth,
        maxHeight,
      }) => {
        return [
          zIndex,
          minimized,
          x,
          y,
          width,
          height,
          canResize && !maximized,
          canDrag,
          minWidth,
          minHeight,
          maxWidth,
          maxHeight,
        ];
      },
    );
  return (
    <Rnd
      id={`win-${win.id}`}
      className={clsx(!minimized && 'pointer-events-auto')}
      default={{
        x: 0,
        y: 0,
        width: 320,
        height: 200,
      }}
      size={{
        width,
        height,
      }}
      position={{
        x,
        y,
      }}
      onDragStop={(e, d) => {
        store.setState({ x: d.x, y: d.y });
      }}
      onResize={(e, direction, ref, delta, position) => {
        store.setState({
          width: ref.offsetWidth,
          height: ref.offsetHeight,
          ...position,
        });
      }}
      dragHandleClassName={'WindowDragHandle'}
      cancel={'.WindowDragCancel'}
      enableResizing={canResize}
      disableDragging={!canDrag}
      bounds={document.body}
      minWidth={minWidth}
      minHeight={minHeight}
      maxWidth={maxWidth}
      maxHeight={maxHeight}
      style={{
        zIndex,
      }}
      ref={(ref) => {
        let ele = ref?.resizableElement.current;
        if (ele && win.state.windowElement !== ele) {
          win.store.setState({ windowElement: ele });
        }
      }}
    >
      <WinContent win={win} />
    </Rnd>
  );
});

const WinContent: FC<{ win: ReactWindow }> = memo(({ win }) => {
  const store = win.store;
  const [frameless, minimized, canMinimize, canMaximize, title, render] = useStoreWithEqualityFn(
    store,
    ({ frameless, minimized, canMinimize, canMaximize, title, render }) => {
      return [frameless, minimized, canMinimize, canMaximize, title, render];
    },
    shallow,
  );

  let rw = getRootWindow();
  useEffect(() => {
    let closer = new Closer();
    let windowElement: HTMLElement | null | undefined;
    const handleWindowElement = (ele?: HTMLElement | null) => {
      if (!ele) {
        return;
      }
      if (ele === windowElement) {
        return;
      }

      ele.addEventListener('mousedown', () => {
        rw.setActive(win);
      });
    };

    handleWindowElement(store.getState().windowElement);

    closer.add(
      store.subscribe((s) => {
        handleWindowElement(s.windowElement);
      }),
    );

    return () => {
      closer.close();
    };
  }, []);

  if (frameless) {
    return <WinFramelessContent win={win} />;
  }
  return <WinFrameContent win={win} />;
});

const WinFramelessContent: FC<{ win: ReactWindow }> = ({ win }) => {
  const store = win.store;
  const [minimized, render] = useStoreWithEqualityFn(
    store,
    ({ minimized, render }) => {
      return [minimized, render];
    },
    shallow,
  );
  return (
    <div
      ref={(ref) => {
        win.setBody(ref);
      }}
      className={clsx(
        'rounded-lg bg-base-100 shadow outline-none @container focus-within:shadow-lg',
        minimized && 'hidden',
      )}
      tabIndex={-1}
      inert={minimized}
      {...getWindowProps(win)}
    >
      <WindowRenderer render={render} />
    </div>
  );
};
const WinFrameContent: FC<{ win: ReactWindow }> = memo(({ win }) => {
  const store = win.store;
  const [minimized, canMinimize, canMaximize, title, render] = useStoreWithEqualityFn(
    store,
    ({ minimized, canMinimize, canMaximize, title, render }) => {
      return [minimized, canMinimize, canMaximize, title, render];
    },
    shallow,
  );
  return (
    <WindowContext.Provider value={win}>
      <WindowFrame
        inert={minimized}
        controller={
          <WindowController
            close={{
              onClick: () => {
                win.close();
              },
            }}
            minimize={{
              disabled: !canMinimize,
              onClick: () => {
                win.minimize();
              },
            }}
            maximize={{
              disabled: !canMaximize,
              onClick: () => {
                win.maximize();
              },
            }}
          />
        }
        onToggleMaximize={() => {
          win.maximize();
        }}
        className={clsx('h-full w-full', minimized && 'hidden')}
        title={title}
        {...getWindowProps(win)}
      >
        <main className={'relative flex-1 overflow-hidden'}>
          <div
            className={'absolute inset-0 overflow-auto @container'}
            ref={(ref) => {
              win.setBody(ref);
            }}
            tabIndex={-1}
          >
            {/* ensure WindowContext works */}
            <WindowRenderer render={render} />
          </div>
        </main>
      </WindowFrame>
    </WindowContext.Provider>
  );
});

const WindowRenderer: FC<{ render?: () => ReactNode }> = ({ render }) => {
  return render?.();
};

function getWindowProps(win: ReactWindow): ComponentPropsWithoutRef<'div'> {
  // https://github.com/facebook/react/issues/6410#issuecomment-207064994
  // 会导致 window 内 input 无法获取焦点
  return {
    // onFocus: (e) => {
    //   win.dispatchEvent(new FocusEvent('focusin', { bubbles: true, cancelable: false }));
    // },
    // onBlur: (e) => {
    //   win.dispatchEvent(new FocusEvent('focusout', { bubbles: true, cancelable: false }));
    // },
  };
}
