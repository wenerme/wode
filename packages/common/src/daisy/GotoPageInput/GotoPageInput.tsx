import React, { useState } from 'react';
import { Button } from '../Button/Button';

export const GotoPageInput: React.FC<{
  count?: number;
  onGoto?: (v: number) => void;
  disabled?: boolean;
}> = ({ count = 0, onGoto }) => {
  const [val, setVal] = useState('');
  const n = parseInt(val);
  const disabled = !Number.isFinite(n) || n < 1 || n > count;

  const goto = () => {
    if (disabled) {
      return;
    }
    onGoto?.(n - 1);
  };
  return (
    <div className={'flex items-center text-xs gap-1.5 text-xs'}>
      <Button className={'btn-xs btn-ghost'} disabled={disabled} onClick={goto}>
        前往
      </Button>
      <input
        type="number"
        className={'input input-bordered input-xs w-[8ch]'}
        value={val}
        onKeyUp={(e) => {
          if (e.code === 'Enter') {
            e.preventDefault();
            goto();
          }
        }}
        onChange={(e) => setVal(e.currentTarget.value)}
      />
      <span>页</span>
    </div>
  );
};
