import React, { useState } from 'react';
import classNames from 'classnames';
import { convertToHtml, extractRawText } from 'mammoth';
import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAsyncEffect } from '@wener/reaction';
import { SimpleFileInput } from '@src/components/TipTapWord/components/SimpleFileInput';

const DemoMenu = () => {
  let [file, setFile] = useState<File>();
  let [state, setState] = useState({ html: '', text: '' });
  useAsyncEffect(async () => {
    if (!file) {
      return;
    }
    let arrayBuffer = await file.arrayBuffer();
    let rel = await convertToHtml({ arrayBuffer });
    let html = rel.value;
    console.log(`toHTML messages`, rel.messages);

    rel = await extractRawText({ arrayBuffer });
    let text = rel.value;
    console.log(`toText messages`, rel.messages);

    setState({ html, text });
  }, [file]);
  // application/vnd.openxmlformats-officedocument.wordprocessingml.document
  const {
    query: { tab = 'render' },
  } = useRouter();
  return (
    <div className={'container mx-auto flex flex-col'}>
      <div className={'py-2'}>
        <SimpleFileInput preview={false} accept={['.docx']} onFile={setFile} />
      </div>
      <div className={'border p-2 flex flex-col'}>
        <div className="tabs">
          <Link href={{ query: { tab: 'render' } }}>
            <a className={classNames('tab tab-lifted', tab === 'render')}>Render</a>
          </Link>
          <Link href={{ query: { tab: 'html' } }}>
            <a className={classNames('tab tab-lifted', tab === 'html')}>HTML</a>
          </Link>
          <Link href={{ query: { tab: 'text' } }}>
            <a className={classNames('tab tab-lifted', tab === 'json')}>Text</a>
          </Link>
        </div>
        <div>
          {tab === 'render' && (
            <div className={'unreset'}>
              <article dangerouslySetInnerHTML={{ __html: state.html }} />
            </div>
          )}
          {tab === 'html' && <textarea readOnly className={'resize-none w-full h-full'} value={state.html} />}
          {tab === 'text' && <textarea readOnly className={'resize-none w-full h-full'} value={state.text} />}
        </div>
      </div>
    </div>
  );
};

const CurrentPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Demo Page</title>
      </Head>
      <DemoMenu />
    </>
  );
};

export default CurrentPage;
