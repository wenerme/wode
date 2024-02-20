import React, { useState } from 'react';
import { ActionFunctionArgs, LoaderFunctionArgs, json } from '@remix-run/node';
import { Form, useActionData, useLoaderData, useNavigate, useSearchParams } from '@remix-run/react';
import { ApkiHeader } from '@src/remix/app/client/package/ApkiHeader';

// export async function action({ request }: ActionFunctionArgs) {
//   const { q: search, p: page } = Object.fromEntries(new URL((request as Request).url).searchParams.entries());
//   console.log('action', { search, page });
//
//   return json({ ok: true, errors: null, search, page });
// }

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { q: search, p: page } = Object.fromEntries(new URL((request as Request).url).searchParams.entries());
  console.log('loader', { search, page });
  return json({});
}

export default function PackageIndex() {
  // const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { p: page } = Object.fromEntries(searchParams.entries());

  const [search, setSearch] = useState(() => {
    return searchParams.get('q') || '';
  });

  console.log(`loader`, loaderData);

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
      </div>

      <div>PackageIndex</div>
    </>
  );
}
