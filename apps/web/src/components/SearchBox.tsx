import React, { useEffect, useState, type ReactNode } from 'react';
import { HiMagnifyingGlass } from 'react-icons/hi2';
import { Button } from '@wener/console/daisy';
import { isDefined } from '@wener/utils';

export const SearchBox: React.FC<{
  value?: string;
  onChange?: (v: string) => void;
  name?: string;
  placeholder?: string;
  icon?: ReactNode;
}> = ({ value, name, onChange, placeholder = '搜索', icon = <HiMagnifyingGlass /> }) => {
  const [edit, setEdit] = useState(value || '');
  useEffect(() => {
    if (isDefined(value) && value !== edit) {
      setEdit(value);
    }
  }, [value]);
  return (
    <div className='form-control'>
      <label className='input-group-sm input-group'>
        <input
          type='search'
          placeholder={placeholder}
          className='input input-sm input-bordered'
          name={name}
          value={edit}
          onChange={(e) => {
            setEdit(e.currentTarget.value);
          }}
          onKeyUp={(e) => {
            if (onChange) {
              e.code === 'Enter' && onChange?.(edit);
            }
          }}
        />
        <Button
          size={'sm'}
          type={onChange ? 'button' : 'submit'}
          onClick={
            onChange
              ? () => {
                  onChange?.(edit);
                }
              : undefined
          }
        >
          {icon}
        </Button>
      </label>
    </div>
  );
};
