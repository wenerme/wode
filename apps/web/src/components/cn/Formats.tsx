import React, { useEffect, useState } from 'react';
import { FaFemale, FaMale } from 'react-icons/fa';
import { DivisionCode } from '@wener/utils/cn';

// import { loadCounty } from '@wener/data/cn/division/loaders';

async function loadCounty() {
  return '';
}

export const DivisionFormat: React.FC<{ value?: string }> = ({ value }) => {
  const [code, setCode] = useState<DivisionCode.ParsedCode | undefined>();
  useEffect(() => {
    Promise.resolve(loadCounty()).then((v) => {
      value && setCode(DivisionCode.parse(value));
    });
  }, [value]);
  if (!value) {
    return null;
  }
  if (code) {
    // fixme
    let title = [].join(' ');
    return (
      <span>
        <span className='mr-1'>{title}</span>
        <small>({value})</small>
      </span>
    );
  }
  return <span className={'text-red-500'}>{value} ❌</span>;
};

export const ValidFormat: React.FC<{ actual: string; expected?: string }> = ({ actual, expected }) => {
  const valid = !expected || actual === expected;
  if (valid) {
    return <span className='text-green-500'>{actual} ✅</span>;
  }
  return (
    <span className={'flex-inline justify-center'}>
      <del className={'text-red-500'}>{actual}</del> ❌ <ins className='text-green-500'>{expected}</ins>
    </span>
  );
};
export const GenderFormat: React.FC<{ value?: string }> = ({ value }) => {
  if (!value) {
    return null;
  }
  switch (value) {
    case 'male':
      return (
        <span className='flex items-center text-blue-500'>
          <FaMale />男
        </span>
      );
    case 'female':
      return (
        <span className='flex items-center text-pink-500'>
          <FaFemale />女
        </span>
      );
  }
  return <span>{value}</span>;
};
