import React from 'react';
import { MdUploadFile } from 'react-icons/md';
import classNames from 'classnames';
import { formatBytes } from '@wener/utils';
import { useFileInput } from '@src/hooks/useFileInput';

export const SimpleFileInput: React.FC<{
  src?: string;
  type?: string;
  onFile?: (file: File, o?: { width: number; height: number }) => void;
  // onNatureSize?: (o: { width: number; height: number }) => void;
  accept?: string[];
  preview?: boolean;
}> = ({ src: initialSrc, preview = true, type: initialType, onFile, accept = ['image/*', 'video/*'] }) => {
  const { state, getLabelProps, getInputProps } = useFileInput({
    onFile,
    accept,
  });
  let type = state.file?.type || initialType || '';
  let src = state.url || initialSrc;
  let isImage = !type || type.startsWith('image/');
  let isVideo = type.startsWith('video/');
  return (
    <label
      className={classNames(
        'inline-flex flex-col items-center justify-center p-1 border rounded text-blue-300 hover:text-blue-400 active:text-blue-500',
        'focus-within:border-blue-500',
      )}
      {...getLabelProps()}
    >
      {src && (
        <>
          {preview && (
            <div className={'flex items-center justify-center'}>
              {isImage && (
                <img
                  src={src}
                  alt={'preview'}
                  onLoad={(e) => {
                    onFile?.(state.file!, {
                      width: e.currentTarget.naturalWidth,
                      height: e.currentTarget.naturalHeight,
                    });
                  }}
                />
              )}
              {isVideo && (
                <video
                  controls
                  src={src}
                  onLoadedMetadata={(e) => {
                    onFile?.(state.file!, { width: e.currentTarget.videoWidth, height: e.currentTarget.videoHeight });
                  }}
                />
              )}
              {!isImage && !isVideo && <MdUploadFile className={'w-20 h-20'} />}
            </div>
          )}
          <div className={'flex flex-col items-center'}>
            <span className={'text-center text-sm'}>{state.name}</span>
            <span className={'text-gray-300 text-xs flex items-center gap-1'}>
              <span>{type}</span>
              <span>{state.file?.size && formatBytes(state.file?.size)}</span>
            </span>
          </div>
        </>
      )}
      {!src && (
        <div className={'p-4'}>
          {preview && <MdUploadFile className={'w-20 h-20'} />}
          {!state.isDragOver && <span className={'text-gray-400'}>Choose file</span>}
          {state.isDragOver && (
            <span className={'text-gray-600'}>{state.acceptable ? 'Drop file' : 'Invalid file'}</span>
          )}
        </div>
      )}
      <input type="file" className={'hidden'} {...getInputProps()} />
    </label>
  );
};
