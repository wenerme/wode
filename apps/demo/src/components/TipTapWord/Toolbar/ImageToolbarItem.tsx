import React, { useState } from 'react';
import { useCurrentEditor } from '@src/components/TipTapWord/hooks';
import { MdImage } from 'react-icons/md';
import { SimpleDialog } from '@src/components/TipTapWord/components/SimpleDialog';
import { SimpleFileInput } from '@src/components/TipTapWord/components/SimpleFileInput';

export const ImageToolbarItem: React.FC<{}> = (props) => {
  let [open, setOpen] = useState(false);
  let editor = useCurrentEditor();
  const [state, setState] = useState<{ file?: File; width?: number; height?: number }>({});
  const doInsert = () => {
    let file = state.file;
    if (!file) {
      return;
    }
    editor
      .chain()
      .setImage({
        src: URL.createObjectURL(file),
        title: file.name,
        alt: file.name,
        'data-width': state.width,
        'data-height': state.height,
      })
      .run();
    setOpen(false);
  };
  return (
    <>
      <button {...props} onClick={() => setOpen(true)}>
        <MdImage />
      </button>
      <SimpleDialog
        visible={open}
        onVisibleChange={setOpen}
        title={'选择图片'}
        action={
          <>
            <button disabled={!state.file} type="button" className="btn btn-primary btn-sm" onClick={doInsert}>
              确定
            </button>
          </>
        }
      >
        <div className="mt-2 text-center">
          <SimpleFileInput accept={['image/*']} onFile={(file, o) => setState({ file, ...o })} />
        </div>
      </SimpleDialog>
    </>
  );
};
