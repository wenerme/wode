import * as React from 'react';
import type { SVGProps } from 'react';
import { memo } from 'react';

const SvgTaxIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    fill='currentColor'
    className='TaxIcon_svg__icon'
    viewBox='0 0 1024 1024'
    {...props}
  >
    <path d='M920.5 727.1c-13.7-9.3-30.4-15.8-49.7-23.3l-2-.8c-9.7-3.8-22.9-8.1-38.2-13.2-1.5-.5-3.1-1-4.7-1.6 21.6-27 39.6-60.2 52.6-97.3 15.6-44.6 23.9-94.2 23.9-143.4 0-52.1-10.2-102.7-30.4-150.4-19.5-46-47.3-87.3-82.8-122.8S712.4 111 666.4 91.5C618.8 71.3 568.2 61.1 516 61.1c-52.1 0-102.7 10.2-150.4 30.4-46 19.5-87.3 47.3-122.8 82.8s-63.3 76.8-82.8 122.8c-20.2 47.6-30.4 98.2-30.4 150.4 0 20.9 1.5 35.1 4.1 52.4 2.5 16.4 17.8 27.6 34.1 25.2 16.4-2.5 27.7-17.8 25.2-34.1-2.3-15.2-3.5-26.1-3.5-43.5 0-87.2 33.9-169.1 95.6-230.7 61.6-61.6 143.6-95.6 230.7-95.6 87.2 0 169.1 33.9 230.7 95.6 61.6 61.6 95.6 143.6 95.6 230.7 0 85.5-28.8 168.5-75.1 216.6-.9.9-1.7 1.9-2.4 2.8-30-11.4-60.8-24.8-84.8-40.3-26.8-17.2-53.2-26.8-78.4-28.6-25.4-1.7-47.9 4.7-65.4 18.5-13.4 10.7-22.7 25.1-26.8 41.6-4.1 16.2-3 33.7 3.2 50.7 5.7 15.8 14.9 29.2 25.1 40.5-49-3.1-115.6-13.8-165.2-46.6-43.9-29-80.3-66.1-109.6-95.9-16.4-16.7-30.5-31.1-43.8-42.2-13.2-10.9-29.9-17.4-47.9-18.6-16.9-1.1-33.9 2.7-49 10.9-16.4 8.9-29.5 22.3-37.9 38.9-9 17.7-12.4 38.7-9.9 60.6C78.6 694 110.8 740 172.7 797c44.8 41.4 97.1 80.6 129.1 101.2 61.1 39.3 130.6 56.8 225.3 56.8H866c18.7 0 42.4-2.1 60.4-18.1 21.1-18.8 23.6-46.6 23.6-65.9 0-24.6.3-41.5.6-56.5.2-11.8.4-21.9.4-33.5 0-22-10.3-40.1-30.5-53.9zm-29.9 86.3c-.3 15.2-.6 32.4-.6 57.6 0 17.3-3.4 21-3.4 21.1-.1.1-3.5 2.9-20.6 2.9H527.1c-82.6 0-142.1-14.6-192.9-47.2-28.8-18.5-78.9-56.1-120.9-94.8-70.1-64.7-78.6-95.6-79.6-103.5-3-25.1 9.3-35.7 16.8-39.8 4.8-2.6 9.9-3.9 14.8-3.9 5.8 0 11.2 1.8 15.4 5.2 11.1 9.2 24.2 22.6 39.4 38.1 31.2 31.8 70.1 71.5 119.4 103.9 80.8 53.3 190.2 58.9 248.2 57.4 9.2-.2 16.1-.9 21.6-2.2 18.5-4.3 25.1-16.3 27.3-23.1 2.5-7.6 4.4-22.6-11.4-38.3-4.2-4.2-9.4-8.3-15.4-13.1-14.5-11.5-34.3-27.2-40.7-45-2.2-6.3-4.6-17.8 4.6-25.2 16.3-13 48.9-2.6 74 13.5 49.3 31.7 118.4 54.5 164.1 69.6 14.5 4.8 27 8.9 35.2 12.1l2 .8c13 5 24.2 9.4 32.4 13.9 7.3 3.9 9.1 6.3 9.4 6.8v.6c.2 11.2 0 21.1-.2 32.6z' />
    <path d='M345.4 523.8c18-22.8 36.4-58.4 51.2-95.2v162h36V415c12 16.8 26 37.2 32 48.8l20.8-29.6c-7.6-9.6-42-44.8-52.8-54.8V371h50.8v-34.4h-50.8V271c17.6-4 34.4-9.2 49.2-14.8l-21.6-30c-30.8 13.2-80.8 24.8-124.4 32 4.4 8.4 9.2 20.4 10.8 28.8 16-2 32.8-4.8 50-8v57.6h-62V371h55.6c-15.2 42.4-40.4 90-63.6 116.8 5.6 9.6 14.8 25.2 18.8 36z' />
    <path d='M455.4 562.6c8 6.4 18.4 20 22.4 29.2 69.2-31.6 85.6-88.8 91.6-159.2h28V541c0 33.6 6.8 44 36.8 44h30.4c25.2 0 34-14 36.8-67.2-8.8-2.8-23.2-8.4-30.4-14.4-1.2 42.8-2.4 49.2-10 49.2h-21.2c-7.2 0-8.4-1.2-8.4-12v-108h48v-130h-41.2c10.8-19.6 22-44 32-66.8l-38.4-12c-7.2 24-20.4 56.4-31.6 78.8H549l24.4-10.8c-6-18.8-21.6-46.4-36-67.2l-31.2 13.2c13.6 20 27.2 46.4 33.2 64.8h-45.6v130h40c-5.2 57.6-17.2 104.8-78.4 130zM529 399.8V335h113.6v64.8H529z' />
  </svg>
);
const Memo = memo(SvgTaxIcon);
export default Memo;