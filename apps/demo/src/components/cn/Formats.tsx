import { FaFemale, FaMale } from 'react-icons/fa';
import { parseDivisionCode } from './division/parseDivisionCode';

export const DivisionFormat: React.FC<{ value?: string }> = ({ value }) => {
  if (!value) {
    return null;
  }
  const code = parseDivisionCode(value);
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
