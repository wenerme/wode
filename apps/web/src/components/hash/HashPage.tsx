'use client';

import React, { useMemo, useState } from 'react';
import { HiDuplicate } from 'react-icons/hi';
import { Button } from '@wener/console/daisy';
import { useAsyncEffect } from '@wener/reaction';
import { ArrayBuffers, copy } from '@wener/utils';
import { HashLockOutlined } from 'common/icons';
import { SearchPageLayout } from '@/components/SearchPageLayout';

export const HashPage = () => {
  return (
    <form method={'get'}>
      <SearchPageLayout name={'content'} title={'摘要哈希'} icon={HashLockOutlined}>
        {({ value }) => {
          return <ContentHashResult content={value} />;
        }}
      </SearchPageLayout>
    </form>
  );
};

const ContentHashResult: React.FC<{ content: string }> = ({ content }) => {
  const data = useMemo(() => new TextEncoder().encode(content), [content]);
  const [result, setResult] = useState<
    Array<{
      id: string;
      title: string;
      content?: string;
      raw?: BufferSource;
      error?: any;
      tags?: Array<{
        title: string;
        className?: string;
      }>;
    }>
  >([]);
  useAsyncEffect(async () => {
    const r = [];
    r.push({
      id: 'base64',
      title: 'Base64',
      content: btoa(content),
      tags: [{ title: 'Encoding', className: 'badge-info' }],
    });
    r.push({
      id: 'hex',
      title: 'Hex',
      content: ArrayBuffers.toString(data, 'hex'),
      tags: [{ title: 'Encoding', className: 'badge-info' }],
    });
    setResult(r);

    for (const algorithm of ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']) {
      try {
        const raw = await crypto.subtle.digest(algorithm, data);
        r.push({
          id: algorithm.replaceAll('-', '').toLowerCase(),
          title: algorithm,
          content: ArrayBuffers.toString(raw, 'hex'),
          raw,
        });
      } catch (e) {
        r.push({
          id: algorithm.replaceAll('-', '').toLowerCase(),
          title: algorithm,
          content: String(e),
          error: e,
          tags: [{ title: 'Error', className: 'badge-danger' }],
        });
      }
    }

    setResult([...r]);
  }, [data]);
  return (
    <div className={'flex flex-col gap-4 py-4'}>
      {result.map(({ id, title, content, tags }) => {
        return (
          <div className='form-control' data-id={id} key={id}>
            <div className='label'>
              <span className='label-text text-lg font-bold'>{title}</span>
              <span className='label-text-alt flex items-center gap-2'>
                {tags?.map(({ title, className }, i) => {
                  return (
                    <span key={i} className={`badge ${className}`}>
                      {title}
                    </span>
                  );
                })}

                {content && (
                  <Button size={'sm'} ghost onClick={() => copy(content)}>
                    <HiDuplicate className={'h-4 w-4'} />
                    复制
                  </Button>
                )}
              </span>
            </div>
            {content && content.length <= 64 && (
              <input className='monospace input input-bordered text-sm' readOnly value={content}></input>
            )}
            {content && content.length > 64 && (
              <textarea className='monospace textarea textarea-bordered h-24' readOnly value={content}></textarea>
            )}
            <label className='label'>
              <span className='label-text-alt'>长度: {content?.length}</span>
            </label>
          </div>
        );
      })}
    </div>
  );
};
