import React, { ReactNode, useEffect, useState } from 'react';
import { BsSearch } from 'react-icons/bs';
import { useParams, useSearchParams } from 'react-router-dom';
import classNames from 'classnames';
import { flexRender, FlexRenderable } from '@wener/reaction';

export const SearchPageLayout: React.FC<{
  name?: string;
  icon?: FlexRenderable<any>;
  title?: ReactNode;
  children?: ReactNode | ((props: { value: string }) => ReactNode);
  placeholder?: string;
  action?: ReactNode;
}> = ({ name = 'search', title, icon, placeholder, action, children }) => {
  const [search] = useSearchParams();
  const { [name]: input = search.get(name) || '' } = useParams();
  const [accessed, setAccessed] = useState(Boolean(input));
  useEffect(() => {
    setAccessed(Boolean(input));
  }, [Boolean(input)]);

  const inputForm = (
    <div
      className={classNames(
        'flex items-center border rounded-full px-4 py-2',
        'hover:bg-base-200 focus-within:bg-base-200 hover:shadow-lg focus-within:shadow-lg',
      )}
    >
      <BsSearch className={'pr-2 w-6 h-6'} />
      <input
        type="search"
        name={name}
        placeholder={placeholder}
        defaultValue={input}
        className={'outline-none flex-1 md:w-96 lg:w-[720px] bg-transparent'}
      />
    </div>
  );
  if (input || accessed) {
    return (
      <div className={'flex flex-col'}>
        <div className={'flex items-center border-b pr-4'}>
          <div className={'p-4 pl-6'}>{flexRender(icon, { className: 'w-8 h-8' })}</div>
          {inputForm}
          <div className={'flex-1'}></div>
          {action}
        </div>
        <div className={'pl-[72px] pt-1 max-w-2xl'}>
          {typeof children === 'function' ? children({ value: input }) : children}
        </div>
      </div>
    );
  }

  return (
    <div className={'flex flex-col items-center gap-4 p-4'}>
      <h3 className={'font-medium text-[48px]'}>{title}</h3>
      {inputForm}
    </div>
  );
};
