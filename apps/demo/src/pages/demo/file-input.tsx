import type { NextPage } from 'next';
import Head from 'next/head';
import React, { HTMLProps, useRef } from 'react';
import { useImmer } from 'use-immer';
import { MdUploadFile } from 'react-icons/md';
import { getFile } from '@wener/utils';
import classNames from 'classnames';
import { useBodyEventListener } from '@wener/reaction';

// https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types
const fileTypes = [
  'image/apng',
  'image/avif',
  'image/bmp',
  'image/gif',
  'image/jpeg',
  'image/pjpeg',
  'image/png',
  'image/svg+xml',
  'image/tiff',
  'image/webp',
  'image/x-icon',
];

const Demo = () => {
  const { state, getLabelProps, getInputProps } = useFileInput({
    accept: ['image/*', 'video/*'],
  });

  return (
    <div className={'container mx-auto'}>
      <div className={'flex mx-auto justify-center max-w-prose'}>
        <label
          className={classNames(
            'inline-flex flex-col items-center justify-center p-1 border rounded text-blue-300 hover:text-blue-400 active:text-blue-500',
            'focus-within:border-blue-500',
          )}
          {...getLabelProps()}
        >
          {state.url && (
            <>
              <div className={'flex items-center justify-center'}>
                {state.file?.type.startsWith('image/') && <img src={state.url} alt={'preview'} />}
                {state.file?.type.startsWith('video/') && <video controls src={state.url} />}
              </div>
              <div className={'flex flex-col items-center'}>
                <span className={'text-center text-sm'}>{state.name}</span>
                <span className={'text-gray-300 text-xs flex items-center gap-1'}>
                  <span>{state.file?.type}</span>
                  <span>{state.file?.size && bytes(state.file?.size || 0)}</span>
                </span>
              </div>
            </>
          )}
          {!state.url && (
            <div className={'p-4'}>
              <MdUploadFile className={'w-20 h-20'} />
              {!state.isDragOver && <span className={'text-gray-400'}>Choose file</span>}
              {state.isDragOver && (
                <span className={'text-gray-600'}>{state.acceptable ? 'Drop file' : 'Invalid file'}</span>
              )}
            </div>
          )}
          <input type="file" className={'hidden'} {...getInputProps()} />
        </label>
      </div>
    </div>
  );
};

const CurrentPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Demo Page</title>
      </Head>
      <Demo />
    </>
  );
};

export default CurrentPage;

function bytes(v: number) {
  if (v < 1024) {
    return v + 'B';
  } else if (v >= 1024 && v < 1048576) {
    return (v / 1024).toFixed(1) + 'KB';
  } else if (v >= 1048576) {
    return (v / 1048576).toFixed(1) + 'MB';
  }
}

interface UseFileInputOptions {
  onFile?: (file: File) => void;
  accept?: string[];
  paste?: boolean;
}

function useFileInput(o: UseFileInputOptions = {}) {
  const { accept = [], paste = true } = o;

  const [state, update] = useImmer<{
    isDragOver: boolean;
    acceptable?: boolean;
    file?: File;
    size: number;
    name?: string;
    url?: string;
  }>({
    isDragOver: false,
    size: 0,
  });
  const enterTargetRef = useRef<EventTarget>();
  const onFile = (file: File, valid = false) => {
    if (!valid) {
      valid = isAcceptable(file, accept);
    }
    if (!valid) {
      return;
    }
    update((s) => {
      s.file = file;
      s.name = file.name;
      s.size = file.size;
      s.url && URL.revokeObjectURL(s.url);
      s.url = URL.createObjectURL(file);
    });
    o.onFile?.(file);
  };

  const onFileRef = useRef(onFile);
  onFileRef.current = onFile;
  useBodyEventListener(
    {
      paste: (e) => {
        if (!paste) {
          return;
        }
        e.preventDefault();
        const { file } = getFile(e.clipboardData) || {};
        file && onFileRef.current(file);
      },
    },
    [o.paste],
  );

  return {
    state,
    getLabelProps(): Partial<HTMLProps<HTMLLabelElement>> {
      return {
        onDragOver: (e) => {
          e.preventDefault();
          if (!state.acceptable) {
            e.dataTransfer.dropEffect = 'none';
          }
        },
        onDragEnter: (e) => {
          e.stopPropagation();
          e.preventDefault();

          enterTargetRef.current = e.target;

          let acceptable = isAcceptable(Array.from(e.dataTransfer.items)[0]?.type, accept);
          update({ ...state, acceptable, isDragOver: true });
          return false;
        },
        onDragLeave: (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (enterTargetRef.current === e.target) {
            update({ ...state, acceptable: undefined, isDragOver: false });
          }
        },
        onDrop: (e) => {
          e.preventDefault();
          e.stopPropagation();

          const { file } = getFile(e.dataTransfer) || {};
          update({ ...state, acceptable: undefined, isDragOver: false });
          file && onFile(file);

          return false;
        },
      };
    },
    getInputProps(): Partial<HTMLProps<HTMLInputElement>> {
      return {
        accept: accept.join(', '),
        onChange: (e) => {
          let file = e.currentTarget.files?.[0];
          file && onFile(file);
        },
      };
    },
  };
}

function isAcceptable(file: File | string | undefined, accept: string[]): boolean {
  if (!file) {
    return false;
  }
  if (!accept.length) {
    return true;
  }
  let type: string;
  if (typeof file === 'string') {
    type = file;
  } else {
    type = file.type;
  }

  return accept.some((v) => {
    if (v.includes('*')) {
      return type.match(v);
    } else {
      return type === v;
    }
  });
}
