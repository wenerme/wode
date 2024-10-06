import type React from 'react';

export const PageSizeSelect: React.FC<{
  value: number;
  onChange?: (size: number) => void;
  options?: number[];
}> = ({ value, onChange, options = [20, 50, 100, 200, 500, 1000] }) => {
  return (
    <div className={'flex items-center text-xs'}>
      <span>每页</span>
      <select
        name='pageSize'
        className={'select select-xs'}
        value={String(value)}
        onChange={(e) => {
          onChange?.(parseInt(e.currentTarget.value));
        }}
      >
        {options.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
      <span>条</span>
    </div>
  );
};
