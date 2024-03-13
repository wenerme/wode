import { useState } from 'react';
import type { MetaFunction } from '@remix-run/node';
import { Form, Link, useNavigate, useSearchParams } from '@remix-run/react';
import { ApkiHeader } from '@/remix/app/client/package/ApkiHeader';

export const meta: MetaFunction = () => {
  return [{ title: 'Alpine Package Index' }, { name: 'description', content: 'Welcome to apk index' }];
};

export default function Index() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { p: page } = Object.fromEntries(searchParams.entries());

  const [search, setSearch] = useState(() => {
    return searchParams.get('q') || '';
  });
  return (
    <>
      <ApkiHeader />
      <div className={'container mx-auto px-2 md:px-0'}>
        <div className={'w-96'}>
          <Form action={'/package'} className={'flex join'}>
            <input
              name={'q'}
              type='search'
              className={'input input-bordered flex-1 join-item '}
              value={search}
              onChange={(e) => {
                let value = e.currentTarget.value;
                setSearch(value);
                // navigate(`?q=${encodeURIComponent(value)}`);
              }}
            />
            <button className={'btn join-item'} type='submit'>
              Search
            </button>
          </Form>
        </div>

        <main>Hi There</main>
      </div>
    </>
  );
}
