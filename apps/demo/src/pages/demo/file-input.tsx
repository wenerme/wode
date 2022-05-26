import type { NextPage } from 'next';
import Head from 'next/head';
import React from 'react';
import { SimpleFileInput } from '@src/components/TipTapWord/components/SimpleFileInput';

// https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types
const fileTypes = [
  'image/apng',
  'image/avif',
  'image/bmp',
  'image/gif',
  'image/jpeg',
  'image/pjpeg',
  'image/png',
  'image/svg+xml',
  'image/tiff',
  'image/webp',
  'image/x-icon',
];

const Demo = () => {
  return (
    <div className={'container mx-auto'}>
      <div className={'flex mx-auto justify-center max-w-prose'}>
        <SimpleFileInput />
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
      <Demo />
    </>
  );
};

export default CurrentPage;
