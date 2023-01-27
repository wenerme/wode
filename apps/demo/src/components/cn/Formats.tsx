import { useEffect, useState } from 'react';
import { FaFemale, FaMale } from 'react-icons/fa';
import { index } from '@src/components/cn/division';
import { DivisionCode, parseDivisionCode } from '@wener/data/cn';

export const DivisionFormat: React.FC<{ value?: string }> = ({ value }) => {
  const [code, setCode] = useState<DivisionCode>();
  useEffect(() => {
    Promise.resolve(index()).then((v) => {
      value && setCode(parseDivisionCode(v || {}, value));
    });
  }, [value]);
  if (!value) {
    return null;
  }
  if (code) {
    let title = code.name;
    if (!value.endsWith('00')) {
      title = `${code.cityName} ${title}`;
    }
    if (!value.endsWith('0000')) {
      title = `${code.provinceName} ${title}`;
    }
    return (
      <span>
        <span className="mr-1">{title}</span>
        <small>({value})</small>
      </span>
    );
  }
  return <span className={'text-red-500'}>{value} ❌</span>;
};

export const ValidFormat: React.FC<{ actual: string; expected?: string }> = ({ actual, expected }) => {
  const valid = !expected || actual === expected;
  if (valid) {
    return <span className="text-green-500">{actual} ✅</span>;
  }
  return (
    <span className={'flex-inline justify-center'}>
      <del className={'text-red-500'}>{actual}</del> ❌ <ins className="text-green-500">{expected}</ins>
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
        <span className="text-blue-500 flex items-center">
          <FaMale />男
        </span>
      );
    case 'female':
      return (
        <span className="text-pink-500 flex items-center">
          <FaFemale />女
        </span>
      );
  }
  return <span>{value}</span>;
};
