import type { MouseEvent } from 'react';
import React, { useRef } from 'react';
import { MdAddCircleOutline, MdOutlineFormatColorReset } from 'react-icons/md';
import classNames from 'classnames';
import styled from 'styled-components';

const colors: Array<[string, string, boolean]> = [
  ['黑色', '#000000', true],
  ['深灰色 4', '#434343', true],
  ['深灰色 3', '#666666', true],
  ['深灰色 2', '#999999', false],
  ['深灰色 1', '#b7b7b7', false],
  ['灰色', '#cccccc', false],
  ['浅灰色 1', '#d9d9d9', false],
  ['浅灰色 2', '#efefef', false],
  ['浅灰色 3', '#f3f3f3', false],
  ['白色', '#ffffff', false],
  ['浆果红', '#980000', true],
  ['红色', '#ff0000', true],
  ['橙色', '#ff9900', false],
  ['黄色', '#ffff00', false],
  ['绿色', '#00ff00', true],
  ['青色', '#00ffff', false],
  ['矢车菊蓝', '#4a86e8', false],
  ['蓝色', '#0000ff', true],
  ['紫色', '#9900ff', true],
  ['洋红色', '#ff00ff', false],
  ['浅浆果红色 3', '#e6b8af', false],
  ['浅红色 3', '#f4cccc', false],
  ['浅橙色 3', '#fce5cd', false],
  ['浅黄色 3', '#fff2cc', false],
  ['浅绿色 3', '#d9ead3', false],
  ['浅青色 3', '#d0e0e3', false],
  ['浅矢车菊蓝色 3', '#c9daf8', false],
  ['浅蓝色 3', '#cfe2f3', false],
  ['浅紫色 3', '#d9d2e9', false],
  ['浅洋红色 3', '#ead1dc', false],
  ['浅浆果红色 2', '#dd7e6b', false],
  ['浅红色 2', '#ea9999', false],
  ['浅橙色 2', '#f9cb9c', false],
  ['浅黄色 2', '#ffe599', false],
  ['浅绿色 2', '#b6d7a8', false],
  ['浅青色 2', '#a2c4c9', false],
  ['浅矢车菊蓝色 2', '#a4c2f4', false],
  ['浅蓝色 2', '#9fc5e8', false],
  ['浅紫色 2', '#b4a7d6', false],
  ['浅洋红色 2', '#d5a6bd', false],
  ['浅浆果红色 1', '#cc4125', true],
  ['浅红色 1', '#e06666', false],
  ['浅橙色 1', '#f6b26b', false],
  ['浅黄色 1', '#ffd966', false],
  ['浅绿色 1', '#93c47d', false],
  ['浅青色 1', '#76a5af', false],
  ['浅矢车菊蓝色 1', '#6d9eeb', false],
  ['浅蓝色 1', '#6fa8dc', false],
  ['浅紫色 1', '#8e7cc3', false],
  ['浅洋红色 1', '#c27ba0', false],
  ['深浆果红色 1', '#a61c00', true],
  ['深红色 1', '#cc0000', true],
  ['深橙色 1', '#e69138', false],
  ['深黄色 1', '#f1c232', false],
  ['深绿色 1', '#6aa84f', true],
  ['深青色 1', '#45818e', true],
  ['深矢车菊蓝色 1', '#3c78d8', true],
  ['深蓝色 1', '#3d85c6', false],
  ['深紫色 1', '#674ea7', true],
  ['深洋红色 1', '#a64d79', true],
  ['深浆果红色 2', '#85200c', true],
  ['深红色 2', '#990000', true],
  ['深橙色 2', '#b45f06', true],
  ['深黄色 2', '#bf9000', true],
  ['深绿色 2', '#38761d', true],
  ['深青色 2', '#134f5c', true],
  ['深矢车菊蓝色 2', '#1155cc', true],
  ['深蓝色 2', '#0b5394', true],
  ['深紫色 2', '#351c75', true],
  ['深洋红色 2', '#741b47', true],
  ['深浆果红色 3', '#5b0f00', true],
  ['深红色 3', '#660000', true],
  ['深橙色 3', '#783f04', true],
  ['深黄色 3', '#7f6000', true],
  ['深绿色 3', '#274e13', true],
  ['深青色 3', '#0c343d', true],
  ['深矢车菊蓝色 3', '#1c4587', true],
  ['深蓝色 3', '#073763', true],
  ['深紫色 3', '#20124d', true],
  ['深洋红色 3', '#4c1130', true],
];
const ColorButton = styled.button`
  width: 20px;
  height: 20px;
  border-radius: 10px;

  position: relative;

  &.checked::before {
    position: absolute;
    top: 0;
    left: 3px;

    font-size: 14px;
    content: '✓';
  }

  &:hover {
    box-shadow: 0 0px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.4);
  }
`;
export const ColorPlates: React.FC<{ value?: string; onChange?: (v: string) => void; onReset?: () => void }> = ({
  value,
  onChange,
  onReset,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerPicker = () => {
    inputRef.current?.click();
  };
  let myColors: Array<[string, string, boolean]> = [];
  try {
    myColors = JSON.parse(localStorage.colors || '[]');
  } catch {
    //
  }
  return (
    <div className={'flex flex-col justify-start'}>
      <button
        type={'button'}
        onClick={triggerPicker}
        className={'rounded p-1 text-xs font-semibold hover:bg-gray-200 text-left'}
      >
        自定义
      </button>
      <div className={'flex flex-wrap gap-1 items-center'}>
        {myColors.map((v, i) => (
          <ColorButton
            key={i}
            value={v[1]}
            onClick={(e: MouseEvent<HTMLButtonElement>) => onChange?.(e.currentTarget?.value)}
            style={{ backgroundColor: v[1], color: v[2] ? 'white' : 'black' }}
          />
        ))}
        <button type={'button'} onClick={triggerPicker} className={'rounded p-1 hover:bg-gray-200'}>
          <MdAddCircleOutline />
        </button>
        <input
          ref={inputRef}
          type="color"
          value={value}
          onChange={(e) => {
            const pick = e.target.value;
            if (!pick) {
              return;
            }
            if (!myColors.find((v) => v[1] === pick) && !colors.find((v) => v[1] === pick)) {
              myColors.push(['', pick, true]);
              localStorage.colors = JSON.stringify(myColors);
            }
            onChange?.(pick);
          }}
          style={{ width: 0, height: 0, border: 'none', opacity: 0 }}
        />
      </div>
      <hr className={'mt-1 mb-2'} />
      <div className={'grid grid-cols-10 gap-1'}>
        {colors.map((v, i) => (
          <ColorButton
            key={i}
            className={classNames(v[1] === value && 'checked')}
            onClick={(e: MouseEvent<HTMLButtonElement>) => onChange?.(e.currentTarget?.value)}
            title={v[0]}
            value={v[1]}
            style={{ backgroundColor: v[1], color: v[2] ? 'white' : 'black' }}
          />
        ))}
      </div>
      {onReset && (
        <button
          onClick={onReset}
          className={'border rounded-full my-2 py-1 text-sm hover:bg-gray-200 flex items-center justify-center'}
        >
          <MdOutlineFormatColorReset className={'w-5 h-5'} /> 无
        </button>
      )}
    </div>
  );
};
