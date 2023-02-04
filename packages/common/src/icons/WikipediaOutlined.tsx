import * as React from 'react';
import { type SVGProps, memo } from 'react';

const SvgWikipediaOutlined = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill="currentColor" {...props}>
    <path d="M515.84 559.744c-39.936 82.432-94.592 194.048-121.728 244.395-26.283 45.824-48.085 39.722-65.365 1.237-59.99-141.696-183.168-390.144-241.11-529.45-10.709-25.643-18.816-42.113-26.41-48.598-7.723-6.4-23.638-10.24-47.872-11.563C4.395 214.741 0 212.565 0 208.981v-19.413l2.219-1.92c39.424-.213 230.442 0 230.442 0l2.176 1.92v18.517c0 5.078-3.2 7.51-9.6 7.51l-24.064 1.322c-20.693 1.238-31.018 6.998-31.018 18.603 0 5.76 2.261 14.08 7.082 25.643 46.166 112.896 205.568 448.896 205.568 448.896l5.803 1.962 102.87-205.226-20.566-45.526-70.741-139.264s-13.568-27.904-18.262-37.205c-31.061-61.568-30.378-64.768-61.738-68.992-8.832-.981-13.355-2.133-13.355-6.357v-19.968l2.56-1.92h183.125l4.822 1.578v19.243c0 4.48-3.243 6.4-9.686 6.4l-13.141 2.005c-33.792 2.603-28.203 16.256-5.803 60.672l67.499 138.752L611.2 266.71c12.501-27.306 9.941-34.176 4.736-40.405-2.987-3.584-13.013-9.387-34.645-10.24l-8.576-.896a9.728 9.728 0 0 1-6.187-2.176 6.4 6.4 0 0 1-2.859-5.504V189.27l2.603-1.92c53.205-.341 172.501 0 172.501 0l2.518 1.92v18.603c0 5.163-2.518 7.595-8.235 7.595-27.563 1.28-33.365 4.053-43.648 18.73-5.12 7.936-16 25.131-27.563 44.331L563.67 460.843l-2.773 5.76 119.125 243.712 7.254 2.048 187.562-445.355c6.571-18.005 5.504-30.805-2.73-38.187-8.406-7.338-14.763-11.648-36.566-12.586l-17.92-.683a10.88 10.88 0 0 1-6.485-1.92c-1.835-1.237-3.072-3.2-3.072-5.077v-18.603l2.517-1.92h211.67l1.749 1.92v18.645c0 5.078-3.157 7.68-8.917 7.68-27.648 1.28-48.086 7.68-61.568 17.963-13.398 10.88-23.766 26.283-31.403 45.525 0 0-172.501 395.008-231.51 526.464-22.4 42.966-44.927 39.126-64.127-1.322-24.363-49.963-75.648-161.536-112.896-243.627l2.261-1.536z" />
  </svg>
);
const Memo = memo(SvgWikipediaOutlined);
export default Memo;
