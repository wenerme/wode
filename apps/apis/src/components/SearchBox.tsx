import React, { useEffect, useState } from 'react';
import { HiMagnifyingGlass } from 'react-icons/hi2';
import { Button } from 'common/src/daisy';
import { isDefined } from '@wener/utils';

export const SearchBox: React.FC<{ value?: string; onChange?: (v: string) => void; name?: string }> = ({
  value,
  name,
  onChange,
}) => {
  const [edit, setEdit] = useState(value || '');
  useEffect(() => {
    if (isDefined(value) && value !== edit) {
      setEdit(value);
    }
  }, [value]);
  return (
    <div className="form-control">
      <label className="input-group-sm input-group">
        <input
          type="search"
          placeholder="搜索"
          className="input-bordered input input-sm"
          name={name}
          value={edit}
          onChange={(e) => { setEdit(e.currentTarget.value); }}
          onKeyUp={(e) => {
            if (onChange) {
              e.code === 'Enter' && onChange?.(edit);
            }
          }}
        />
        <Button
          size={'sm'}
          type={onChange ? 'button' : 'submit'}
          onClick={onChange ? () => { onChange?.(edit); } : undefined}
        >
          <HiMagnifyingGlass />
        </Button>
      </label>
    </div>
  );
};
