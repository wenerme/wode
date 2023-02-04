import * as React from 'react';
import { type SVGProps, memo } from 'react';

const SvgBittorrentFilled = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill="currentColor" {...props}>
    <path d="M1024 512c0 282.773-229.227 512-512 512S0 794.773 0 512 229.227 0 512 0s512 229.227 512 512" />
    <path
      fill="#D0D1D1"
      d="M830.464 815.51c-33.472-.449-66.944-.214-100.416-.214 0-.085-.32.747-.32.64-30.421 0-60.8 1.643-90.88-1.408-74.09-7.53-139.904-35.243-193.003-88.896-49.13-49.664-66.816-121.216-43.989-174.123 32.512-75.413 85.077-107.413 166.208-106.73 50.475.426 86.741 25.514 116.352 60.757 6.507 7.744 12.117 13.717 17.13 18.475l54.806-44.587c-5.227-7.893-12.096-15.36-15.744-20.053-51.627-66.432-120.427-86.422-203.157-85.867-152.064 1.024-278.742 187.947-186.39 345.237 85.248 145.216 258.56 167.894 403.328 167.467 24.32-.043 48.043-8.405 66.347-24.384a459.69 459.69 0 0 0 44.501-44.63 767.723 767.723 0 0 0-34.773-1.685"
    />
    <path
      fill="#D0D1D1"
      d="M551.317 890.005c-138.24-28.821-244.906-135.893-255.04-276.394-7.637-105.558 38.912-188.374 136.15-240 59.114-31.424 109.802-37.526 187.221-19.414 8.747 2.048 15.573 3.776 21.653 5.974l26.134-68.608a345.387 345.387 0 0 0-17.43-5.568c-105.877-30.976-202.41-12.672-292.522 48.597-132.096 89.813-169.643 268.395-100.608 417.877 51.712 94.422 151.765 149.291 232.341 179.67 18.283 6.89 37.27 11.968 56.47 15.53 19.669 3.627 37.013 6.422 52.415 8.534a154.155 154.155 0 0 0 70.187-6.614 450.816 450.816 0 0 0 90.261-42.112c-68.138-3.477-154.154-6.4-207.232-17.493"
    />
    <path
      fill="#D0D1D1"
      d="M425.045 928.896c-25.514-9.835-49.28-23.979-72.085-40.704a385.75 385.75 0 0 1-92.053-90.07 64.597 64.597 0 0 1-10.646-13.247 409.216 409.216 0 0 1-17.066-32.043 244.757 244.757 0 0 1-12.523-28.97l-.17-.47-.726-2.197c-54.443-145.067-16.896-307.947 114.219-406.059 52.992-39.68 109.44-62.677 178.069-68.907a449.067 449.067 0 0 1 31.68-1.856v-70.72c-7.936-.085-18.347 0-32.597.128-36.907.342-71.894 7.83-106.454 20.48-167.253 61.227-270.89 199.616-280.405 365.803-6.912 120.256 27.477 233.45 112.021 311.552a451.755 451.755 0 0 0 286.422 101.867c11.477 0 22.826-.555 34.069-1.408 3.541-.918 7.04-1.494 10.603-2.688-55.552-8.278-102.55-22.678-142.358-40.491"
    />
  </svg>
);
const Memo = memo(SvgBittorrentFilled);
export default Memo;
