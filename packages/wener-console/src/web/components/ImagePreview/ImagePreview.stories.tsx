import React from 'react';
import type { Meta } from '@storybook/react';
import { ImagePreview } from './ImagePreview';

const meta: Meta = {
  title: 'web/components/ImagePreview',
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

export const Demo = () => {
  return (
    <ImagePreview
      src={'https://placehold.co/600x400/png'}
      info={{
        size: 1234567,
        format: 'PNG',
        mimeType: 'image/png',
      }}
    />
  );
};
