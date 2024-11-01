import React from 'react';
import { firstOfMaybeArray } from '@wener/utils';
import type { ZXCVBNResult } from 'zxcvbn';
import { ZxcvbnPasswordStrength } from '@/components/zxcvbn/ZxcvbnPasswordStrength';
import type { NextPageProps } from '@/types';

export default async function (props: NextPageProps) {
  const password = firstOfMaybeArray((await props.searchParams).password);
  let data: ZXCVBNResult | undefined;
  if (password && typeof password === 'string') {
    const { default: check } = await import('zxcvbn');
    data = check(password);
  }
  return <ZxcvbnPasswordStrength password={password} data={data} />;
}
