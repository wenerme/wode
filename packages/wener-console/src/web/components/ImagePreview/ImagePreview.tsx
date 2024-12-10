'use client';

import React, { useContext, useEffect, useState, type FC, type HTMLProps } from 'react';
import { HiChevronDoubleLeft, HiChevronDoubleRight, HiXMark } from 'react-icons/hi2';
import {
  PiArrowClockwise,
  PiArrowCounterClockwise,
  PiCopy,
  PiCornersIn,
  PiCornersOut,
  PiDownloadSimple,
} from 'react-icons/pi';
import { TbTextRecognition } from 'react-icons/tb';
import { createReactContext, useAbortController } from '@wener/reaction';
import { copy, download, formatBytes, getGlobalThis, loadScripts } from '@wener/utils';
import clsx from 'clsx';
import { createStore, useStore } from 'zustand';
import { mutative } from 'zustand-mutative';
import { useShallow } from 'zustand/react/shallow';
import { showErrorToast, showSuccessToast } from '../../../toast';

interface ImagePreviewState {
  detail: boolean;
  enlarge: boolean;
  rotate: number;
  src?: string;
  text?: string;
  imgRef?: HTMLImageElement;
  info: ImageInfo;
}

interface ImageInfo {
  width?: number;
  height?: number;
  size?: number;
  sha256?: string;
  mimeType?: string;
  format?: string;
}

function createImagePreviewStore(initial?: Partial<ImagePreviewState>) {
  const state: ImagePreviewState = {
    detail: false,
    enlarge: false,
    rotate: 0,
    info: {},
    ...initial,
  };
  return createStore(mutative(() => state));
}

export interface ImagePreviewProps {
  src?: string;
  info?: ImageInfo;
  onOpenChange?: (show: boolean) => void;
}

const Context = createReactContext('ImagePreviewStoreContext', createImagePreviewStore());

export function useImagePreviewStore() {
  return useContext(Context);
}

export function useImagePreviewContext() {
  let store = useContext(Context);
  return { store };
}

const DetailButton = () => {
  let { store } = useImagePreviewContext();
  const showDetail = useStore(store, (s) => s.detail);
  const setShowDetail = (v: boolean) => {
    store.setState({ detail: v });
  };
  return (
    <ActionButton
      className={'absolute right-4 top-4 z-10'}
      onClick={() => {
        setShowDetail(!showDetail);
      }}
    >
      {showDetail && <HiChevronDoubleRight className={'h-6 w-6 text-white/75'} />}
      {!showDetail && <HiChevronDoubleLeft className={'h-6 w-6 text-white/75'} />}
    </ActionButton>
  );
};

export const ImagePreview: FC<ImagePreviewProps> = ({ onOpenChange, info, src }) => {
  const [store] = useState(() => createImagePreviewStore({ src, info: info, detail: true }));

  useEffect(() => {
    store.setState((s) => {
      s.src = src;
      s.info = {
        ...s.info,
        ...info,
      };
    });
  }, [src, info]);

  return (
    <Context.Provider value={store}>
      <div className={'relative z-10 h-full w-full overflow-hidden bg-black/90'}>
        <div className={'absolute inset-0'}>
          <div className={'flex h-full'}>
            <div className={'relative flex h-full flex-1 flex-col'}>
              <ActionButton className={'absolute left-4 top-4 z-10'} onClick={() => onOpenChange?.(false)}>
                <HiXMark className={'h-6 w-6 text-white/75'} />
              </ActionButton>
              <DetailButton />
              <div className={'relative flex flex-1 items-center justify-center overflow-hidden'}>
                <_Image />
              </div>
              <div className={'flex justify-center pb-4 text-white'}>
                <Actions />
              </div>
            </div>
            <DetailPanel />
          </div>
        </div>
      </div>
    </Context.Provider>
  );
};

const _Image = () => {
  const { store } = useImagePreviewContext();
  const { rotate, enlarge, src } = useStore(
    store,
    useShallow(({ rotate, enlarge, src }) => ({ rotate, enlarge, src })),
  );
  if (!src) {
    return <div>无图片</div>;
  }
  return (
    <img
      crossOrigin='anonymous'
      className={'max-h-full object-contain'}
      src={src}
      alt={'preview image'}
      ref={(imgRef) => {
        if (imgRef) {
          if (store.getState().imgRef !== imgRef) {
            store.setState({ imgRef });
          }
        }
      }}
      style={{
        transform: `rotate(${rotate}deg) scale(${enlarge ? 2 : 1})`,
      }}
      onLoad={(e) => {
        let w = e.currentTarget.naturalWidth;
        let h = e.currentTarget.naturalHeight;
        store.setState((s) => {
          s.info.width = w;
          s.info.height = h;
        });
      }}
    />
  );
};

const Actions = () => {
  let { store } = useImagePreviewContext();
  let { enlarge, src } = useStore(
    store,
    useShallow(({ enlarge, src }) => ({ enlarge, src })),
  );
  return (
    <div className={'flex gap-2'}>
      <FuncButton
        onClick={() => {
          store.setState({ enlarge: !enlarge });
        }}
      >
        {!enlarge && <PiCornersOut className={'h-6 w-6'} />}
        {enlarge && <PiCornersIn className={'h-6 w-6'} />}
      </FuncButton>
      <FuncButton
        onClick={() => {
          store.setState((s) => {
            s.rotate = (s.rotate + 90) % 360;
          });
        }}
      >
        <PiArrowCounterClockwise className={'h-6 w-6'} />
      </FuncButton>
      <FuncButton
        onClick={() => {
          store.setState((s) => {
            s.rotate = (s.rotate + 270) % 360;
          });
        }}
      >
        <PiArrowClockwise className={'h-6 w-6'} />
      </FuncButton>
      {src && (
        <FuncButton
          onClick={() => {
            download('img.jpg', src);
          }}
        >
          <PiDownloadSimple className={'h-6 w-6'} />
        </FuncButton>
      )}
      {/*
      <FuncButton title={'上传保存'} onClick={() => {}}>
        <PiUploadSimple className={'w-6 h-6'} />
      </FuncButton>
      */}
    </div>
  );
};

const DetailPanel = () => {
  let store = useContext(Context);
  const showDetail = useStore(store, (s) => s.detail);
  const { width, height, size, mimeType, format } = useStore(store, (s) => s.info || {});
  if (!showDetail) {
    return;
  }
  return (
    <div className={'w-60 bg-base-100'}>
      <header className={'px-2 py-4'}>
        <h2 className={'text-lg font-semibold'}>图片信息</h2>
      </header>
      <hr />
      <div>
        <div
          className={clsx(
            'flex flex-col gap-2 px-2 py-2',
            '[&>div>span:first-child]:inline-block',
            '[&>div>span:first-child]:w-[5ch]',
            '[&>div>span:last-child]:font-semibold',
          )}
        >
          <div>
            <span>尺寸</span>
            <span>
              {width}x{height}
            </span>
          </div>
          {size && (
            <div>
              <span>大小</span>
              <span>{formatBytes(size, true)}</span>
            </div>
          )}
          {format && (
            <div>
              <span>格式</span>
              <span>{format}</span>
            </div>
          )}
          {mimeType && (
            <div>
              <span>MIME</span>
              <span>{mimeType}</span>
            </div>
          )}
        </div>
      </div>
      <hr className={'my-2'} />
      <div className={'p-2'}>
        <_TextRecognitionButton />
      </div>
      <hr className={'my-2'} />
      <_ExtraInfo />
    </div>
  );
};

const _ExtraInfo = () => {
  const { store } = useImagePreviewContext();
  const text = useStore(store, (s) => s.text);
  return (
    <div className={'p-2'}>
      {text && (
        <label className='form-control w-full max-w-xs'>
          <div className='label'>
            <span className='label-text'>识别结果</span>
            <span className='label-text-alt'>
              <button
                type={'button'}
                className={'btn btn-xs'}
                onClick={async () => {
                  try {
                    await copy(text);
                    showSuccessToast('已复制');
                  } catch (e) {
                    showErrorToast(e);
                  }
                }}
              >
                <PiCopy className={'h-4 w-4'} />
                复制
              </button>
            </span>
          </div>
          <textarea className={'textarea textarea-bordered textarea-sm h-24 w-full'} value={text} readOnly />
        </label>
      )}
    </div>
  );
};

const _TextRecognitionButton = () => {
  let { store } = useImagePreviewContext();
  const imgRef = useStore(store, (s) => s.imgRef);
  const { recognize, loading } = useTesseract();
  return (
    <button
      type={'button'}
      className={clsx('btn btn-sm')}
      disabled={loading}
      onClick={async () => {
        if (!imgRef) {
          return;
        }
        try {
          const { text } = await recognize(imgRef);
          store.setState({ text });
        } catch (e) {
          showErrorToast(e);
        }
      }}
    >
      <TbTextRecognition className={clsx('h-4 w-4', loading && 'loading loading-spinner')} />
      文字识别
    </button>
  );
};

const ActionButton: FC<HTMLProps<HTMLButtonElement>> = ({ className, type, ...props }) => {
  return (
    <button
      type={'button'}
      className={clsx('btn btn-circle border-none bg-black/20 hover:bg-black/75', className)}
      {...props}
    />
  );
};

const FuncButton: FC<HTMLProps<HTMLButtonElement>> = ({ className, type, ...props }) => {
  const A = (props.href ? 'a' : 'button') as 'button';
  return (
    <A
      type={'button'}
      className={clsx('btn btn-circle border-none bg-black/45 text-white hover:bg-black/85', className)}
      {...props}
    />
  );
};

function useTesseract() {
  const [loading, setLoading] = useState(false);

  const ac = useAbortController();

  const doLoad = async () => {
    await loadScripts('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
  };

  return {
    loading,
    recognize: async (img: File | Blob | HTMLImageElement | HTMLCanvasElement | string) => {
      setLoading(true);
      try {
        await doLoad();
        const worker = await (getGlobalThis() as any).Tesseract.createWorker('chi_sim');
        ac.signal.addEventListener('abort', () => {
          worker.terminate();
        });
        let raw = await worker.recognize(img);
        return {
          raw,
          text: raw.data.text,
        };
      } finally {
        setLoading(false);
      }
    },
  };
}
