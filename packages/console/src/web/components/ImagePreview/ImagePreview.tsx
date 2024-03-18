'use client';

import React, { HTMLProps, useContext, useEffect, useState } from 'react';
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
import { useAbortController } from '@wener/reaction';
import { mutative } from '@wener/reaction/mutative/zustand';
import { copy, download, formatBytes, getGlobalThis, loadScripts } from '@wener/utils';
import clsx from 'clsx';
import { createStore, useStore } from 'zustand';
import { showErrorToast, showSuccessToast } from '@/toast';

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

const Context = React.createContext(createImagePreviewStore());

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
      className={'z-10 absolute right-4 top-4'}
      onClick={() => {
        setShowDetail(!showDetail);
      }}
    >
      {showDetail && <HiChevronDoubleRight className={'w-6 h-6 text-white/75'} />}
      {!showDetail && <HiChevronDoubleLeft className={'w-6 h-6 text-white/75'} />}
    </ActionButton>
  );
};

export const ImagePreview: React.FC<ImagePreviewProps> = ({ onOpenChange, info, src }) => {
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
      <div className={'relative w-full h-full overflow-hidden bg-black/90 z-10'}>
        <div className={'absolute inset-0'}>
          <div className={'flex h-full'}>
            <div className={'flex-1 h-full relative flex flex-col'}>
              <ActionButton className={'z-10 absolute left-4 top-4'} onClick={() => onOpenChange?.(false)}>
                <HiXMark className={'w-6 h-6 text-white/75'} />
              </ActionButton>
              <DetailButton />
              <div className={'flex-1 flex justify-center items-center relative overflow-hidden'}>
                <_Image />
              </div>
              <div className={'text-white flex justify-center pb-4'}>
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
  const { rotate, enlarge, src } = useStore(store, ({ rotate, enlarge, src }) => ({ rotate, enlarge, src }));
  if (!src) {
    return <div>无图片</div>;
  }
  return (
    <img
      crossOrigin='anonymous'
      className={'object-contain'}
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
  let { enlarge, src } = useStore(store, ({ enlarge, src }) => ({ enlarge, src }));
  return (
    <div className={'flex gap-2'}>
      <FuncButton
        onClick={() => {
          store.setState({ enlarge: !enlarge });
        }}
      >
        {!enlarge && <PiCornersOut className={'w-6 h-6'} />}
        {enlarge && <PiCornersIn className={'w-6 h-6'} />}
      </FuncButton>
      <FuncButton
        onClick={() => {
          store.setState((s) => {
            s.rotate = (s.rotate + 90) % 360;
          });
        }}
      >
        <PiArrowCounterClockwise className={'w-6 h-6'} />
      </FuncButton>
      <FuncButton
        onClick={() => {
          store.setState((s) => {
            s.rotate = (s.rotate + 270) % 360;
          });
        }}
      >
        <PiArrowClockwise className={'w-6 h-6'} />
      </FuncButton>
      {src && (
        <FuncButton
          onClick={() => {
            download('img.jpg', src);
          }}
        >
          <PiDownloadSimple className={'w-6 h-6'} />
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
  const { width, height, size, mimeType, format } = useStore(store, (s) => s.info);
  if (!showDetail) {
    return;
  }
  return (
    <div className={'bg-base-100 w-60'}>
      <header className={'px-2 py-4'}>
        <h2 className={'text-lg font-semibold'}>图片信息</h2>
      </header>
      <hr />
      <div>
        <div
          className={clsx(
            'px-2 py-2 flex gap-2 flex-col',
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
                <PiCopy className={'w-4 h-4'} />
                复制
              </button>
            </span>
          </div>
          <textarea className={'textarea textarea-bordered textarea-sm w-full h-24'} value={text} readOnly />
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
      <TbTextRecognition className={clsx('w-4 h-4', loading && 'loading loading-spinner')} />
      文字识别
    </button>
  );
};

const ActionButton: React.FC<HTMLProps<HTMLButtonElement>> = ({ className, type, ...props }) => {
  return (
    <button
      type={'button'}
      className={clsx('bg-black/20 hover:bg-black/75 btn btn-circle border-none', className)}
      {...props}
    />
  );
};

const FuncButton: React.FC<HTMLProps<HTMLButtonElement>> = ({ className, type, ...props }) => {
  const A = (props.href ? 'a' : 'button') as 'button';
  return (
    <A
      type={'button'}
      className={clsx('bg-black/45  hover:bg-black/85 btn btn-circle border-none text-white', className)}
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
