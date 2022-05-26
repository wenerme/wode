import { useImmer } from 'use-immer';
import { HTMLProps, useRef } from 'react';
import { useBodyEventListener } from '@wener/reaction';
import { getFile } from '@wener/utils';

interface UseFileInputOptions {
  onFile?: (file: File) => void;
  accept?: string[];
  paste?: boolean;
}

export function useFileInput(o: UseFileInputOptions = {}) {
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
