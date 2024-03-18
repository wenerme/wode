'use client';

import React, { HTMLProps, useContext, useState } from 'react';
import { ImagePreview } from '@/web/components/ImagePreview/ImagePreview';

export default function CurrentPage() {
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
}
