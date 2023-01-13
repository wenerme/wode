import React, { useMemo, useState } from 'react';
import { HiDuplicate } from 'react-icons/hi';
import { Form } from 'react-router-dom';
import { Button } from 'common/src/daisy';
import { HashLockOutlined } from 'common/src/icons';
import { SearchPageLayout } from 'common/src/system/layouts';
import { useAsyncEffect } from '@wener/reaction';
import { ArrayBuffers, copy } from '@wener/utils';

export const HashPage = () => {
  return (
    <Form method={'get'} action={'/hash'}>
      <SearchPageLayout name={'content'} title={'摘要哈希'} icon={HashLockOutlined}>
        {({ value }) => {
          return <ContentHashResult content={value} />;
        }}
      </SearchPageLayout>
    </Form>
  );
};

export default HashPage;

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
          <div className="form-control" data-id={id} key={id}>
            <div className="label">
              <span className="label-text font-bold text-lg">{title}</span>
              <span className="label-text-alt flex items-center gap-2">
                {tags?.map(({ title, className }, i) => {
                  return (
                    <span key={i} className={`badge ${className}`}>
                      {title}
                    </span>
                  );
                })}

                {content && (
                  <Button size={'sm'} ghost onClick={() => copy(content)}>
                    <HiDuplicate className={'w-4 h-4'} />
                    复制
                  </Button>
                )}
              </span>
            </div>
            {content && content.length <= 64 && (
              <input className="input input-bordered monospace text-sm" readOnly value={content}></input>
            )}
            {content && content.length > 64 && (
              <textarea className="textarea textarea-bordered h-24 monospace" readOnly value={content}></textarea>
            )}
            <label className="label">
              <span className="label-text-alt">长度: {content?.length}</span>
            </label>
          </div>
        );
      })}
    </div>
  );
};
