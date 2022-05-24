import React, { useEffect, useRef, useState } from 'react';
import { TipTapWord } from '@src/contents/TipTap/TipTapWord';

export const TipTapPageContent = () => {
  return <TipTapWord />;
};

const DisplayValue: React.FC<{ title: string; value: string; onSet?: (v: string) => void }> = ({
  title,
  value,
  onSet,
}) => {
  const [edit, setEdit] = useState(value);
  const lastRef = useRef(value);

  useEffect(() => {
    if (lastRef.current === edit) {
      setEdit(value);
      lastRef.current = value;
    }
  }, [value]);
  return (
    <div className={'flex flex-col gap-2'}>
      <h3 className={'border-b flex justify-between items-center p-2'}>
        <span className={'font-bold'}>{title}</span>

        <div className={'flex gap-2'}>
          <button
            className={'btn btn-xs btn-outline'}
            disabled={edit === value}
            onClick={() => {
              lastRef.current = value;
              setEdit(value);
            }}
          >
            Reset
          </button>
          <button className={'btn btn-xs btn-outline'} disabled={edit === value} onClick={() => onSet?.(edit)}>
            Set
          </button>
        </div>
      </h3>
      <textarea
        spellCheck="false"
        rows={10}
        className={'border rounded font-mono'}
        value={edit}
        onChange={(e) => setEdit(e.target.value)}
      />
    </div>
  );
};
