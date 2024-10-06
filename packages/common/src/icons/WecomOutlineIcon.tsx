import * as React from 'react';
import type { SVGProps } from 'react';
import { memo } from 'react';

const SvgWecomOutlineIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    fill='currentColor'
    className='WecomOutlineIcon_svg__icon'
    viewBox='0 0 1228 1024'
    {...props}
  >
    <path d='M1119 779a175 175 0 0 0-60 25 147 147 0 0 1-66 40c3-23 14-43 31-59a218 218 0 0 0 30-70 65 65 0 1 1 65 64m-118-155a217 217 0 0 0-71-30 65 65 0 1 1 65-65 177 177 0 0 0 24 61 148 148 0 0 1 40 66 98 98 0 0 1-58-32M894 396c-19-164-189-292-394-292-218 0-396 145-396 324a303 303 0 0 0 142 246 400 400 0 0 0 43 28l-18 70 19 9 89-45c13 4 26 6 40 8l26 4a456 456 0 0 0 166-9 320 320 0 0 0 13 71 547 547 0 0 1-124 14 538 538 0 0 1-111-12l-161 80a36 36 0 0 1-38-4 36 36 0 0 1-13-37l29-116A376 376 0 0 1 32 428C32 209 242 32 500 32c246 0 447 160 466 363a315 315 0 0 0-34-3zM745 651c21-4 42-12 60-24a147 147 0 0 1 66-40 98 98 0 0 1-31 58c-14 22-25 46-30 71a65 65 0 1 1-65-65m116 156c22 15 46 25 71 31a65 65 0 1 1-65 65 176 176 0 0 0-24-61 147 147 0 0 1-39-67 98 98 0 0 1 57 33z' />
  </svg>
);
const Memo = memo(SvgWecomOutlineIcon);
export default Memo;
