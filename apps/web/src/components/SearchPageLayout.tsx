import type React from 'react';
import type { ReactNode } from 'react';
import { BsSearch } from 'react-icons/bs';
import { flexRender, type FlexRenderable } from '@wener/reaction';
import { clsx } from 'clsx';
import { useSearchParams } from 'next/navigation';

export const SearchPageLayout: React.FC<{
  name?: string;
  icon?: FlexRenderable<any>;
  title?: ReactNode;
  children?: ReactNode | ((props: { value: string }) => ReactNode);
  placeholder?: string;
  action?: ReactNode;
}> = ({ name = 'search', title, icon, placeholder, action, children }) => {
  const value = useSearchParams()?.get(name) || '';
  // const { [name]: input = search.get(name) || '' } = useParams();
  // const [accessed, setAccessed] = useState(Boolean(input));
  // useEffect(() => {
  //   setAccessed(Boolean(input));
  // }, [Boolean(input)]);

  // const value = '';

  const inputForm = (
    <div
      className={clsx(
        'flex items-center rounded-full border px-4 py-2',
        'focus-within:bg-base-200 focus-within:shadow-lg hover:bg-base-200 hover:shadow-lg',
      )}
    >
      <BsSearch className={'h-6 w-6 pr-2'} />
      <input
        type='search'
        name={name}
        placeholder={placeholder}
        defaultValue={value}
        className={'flex-1 bg-transparent outline-none md:w-96 lg:w-[720px]'}
      />
    </div>
  );
  if (value) {
    return (
      <div className={'flex flex-col'}>
        <div className={'flex items-center border-b pr-4'}>
          <div className={'p-4 pl-6'}>{flexRender(icon, { className: 'w-8 h-8' })}</div>
          {inputForm}
          <div className={'flex-1'}></div>
          {action}
        </div>
        <div className={'max-w-2xl pl-[72px] pt-1'}>
          {typeof children === 'function' ? children({ value: value }) : children}
        </div>
      </div>
    );
  }

  return (
    <div className={'flex flex-col items-center gap-4 p-4'}>
      <h3 className={'text-[48px] font-medium'}>{title}</h3>
      {inputForm}
    </div>
  );
};
