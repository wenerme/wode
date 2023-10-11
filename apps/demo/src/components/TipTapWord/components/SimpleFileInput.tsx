import React from 'react';
import { MdUploadFile } from 'react-icons/md';
import { useFileInput } from '@src/hooks/useFileInput';
import { formatBytes } from '@wener/utils';
import classNames from 'classnames';

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
  const type = state.file?.type || initialType || '';
  const src = state.url || initialSrc;
  const isImage = !type || type.startsWith('image/');
  const isVideo = type.startsWith('video/');
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
      <input type='file' className={'hidden'} {...getInputProps()} />
    </label>
  );
};

function createProgressTrackingStream({ total }: { total?: number }) {
  const state = {
    transformed: 0,
    progress: 0,
    total,
    done: false,
  };
  // chrome v105+
  // https://stackoverflow.com/a/69400632/1870054
  const stream = new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(chunk);
      state.transformed += chunk.byteLength;
      if (state.total) {
        state.progress = state.transformed / state.total;
      }
    },
    flush(controller) {
      state.done = true;
    },
  });
  return {
    stream,
    state,
  };
}
