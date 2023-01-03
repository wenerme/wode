import * as React from 'react';
import { SVGProps, memo } from 'react';

const SvgWomenWithMicroPhoneFilled = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={200} height={200} viewBox="0 0 1024 1024" {...props}>
    <path d="M870.1 562.4v-25.5c2-116.5-32.2-214.5-99.6-284-32.2-33.2-71-58.2-116-75.6-7.2-62.8-74.6-112.4-156.8-112.4-82.2 0-150.2 49.5-156.8 112.4-45 17.4-83.8 42.4-116 75.6-67.4 69.5-101.7 167-99.6 283.5v31.2c-17.4 17.9-31.2 44.4-20.9 82.2 7.7 28.1 28.1 48.5 53.1 57.7 12.8 8.2 27.6 12.8 43.9 12.8 32.2 141 148.1 237 299.9 237 151.7 0 267.7-96 299.9-237.5 1 0 2 .5 3.1.5 19.9 0 38.3-7.2 53.1-18.9 18.9-10.7 33.7-29.1 39.8-52.1 10.7-41-7.2-69.1-27.1-86.9zm-88.9 77.1c0 18.9-1.5 36.8-4.1 54.1-49.5 79.7-131.3 131.8-232.9 143-7.7-10.2-23-16.9-40.9-16.9-25.5 0-46 13.8-46 31.2 0 16.9 20.4 31.2 46 31.2 23 0 41.4-11.2 45.5-26.1 32.7-3.6 63.9-11.7 93.5-23.5 41.9-16.9 78.7-41.9 109.8-73.6 5.1-5.1 9.7-10.2 14.3-15.8-36.8 113-135.4 185.5-263.6 185.5h-1c-165 0-279.9-119-279.9-289.1l-.5-16.3c0-7.2 1-26.6 2-45 68.5-25 130.3-120.6 155.3-164.5 23 31.2 75.6 91.4 156.3 122.6 30.1 11.7 60.8 17.9 90.9 24.5 59.8 12.8 116.5 25 154.8 75.1l1.5 1.5-1 2.1zm0 0" />
  </svg>
);

const Memo = memo(SvgWomenWithMicroPhoneFilled);
export default Memo;
