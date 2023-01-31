import * as React from 'react';
import { SVGProps, memo } from 'react';

const SvgRtcOutlined = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill="currentColor" {...props}>
    <path d="M457.216 470.016c-2.048-35.84-24.576-54.272-71.168-56.32H314.88c-26.624-2.048-39.424 10.752-39.424 37.376v134.144c0 20.992 10.752 31.744 31.744 33.792 20.992-2.048 31.744-12.8 31.744-33.792v-41.472h24.576c16.896 0 24.576 6.144 26.624 20.992l2.048 26.624c2.048 18.944 14.848 26.624 35.84 26.624 18.944 0 26.624-7.68 29.696-22.528 0-4.096 0-10.752-2.048-20.992v-7.168l-2.048-16.896c-2.048-18.944-14.848-29.696-37.376-31.744 26.112-5.632 40.96-20.48 40.96-48.64zm-87.04 32.768h-31.744v-37.376h31.744c18.944-2.048 26.624 6.144 26.624 18.944 0 11.776-8.192 18.432-26.624 18.432zm373.76-47.616c14.848-2.048 25.6 4.096 31.744 16.896 5.12 8.704 8.704 12.8 10.752 14.848 2.048 4.096 7.168 4.096 12.8 4.096 18.944 0 29.696-9.728 31.744-26.624-7.168-33.792-33.792-52.224-83.968-56.32-67.072 6.144-102.912 41.472-104.96 107.008 2.048 67.072 37.376 100.864 105.984 98.816 52.224-4.096 80.384-22.528 83.968-56.32 0-15.872-10.752-24.576-29.696-26.624-7.68 0-16.896 5.12-22.528 12.8-10.752 14.848-20.992 22.528-31.744 20.992-24.576 0-39.424-18.944-39.424-54.272 0-34.304 12.8-53.248 35.328-55.296zM553.984 617.472c20.992 0 31.744-12.8 31.744-33.792V463.872h39.424c18.944-2.048 26.624-9.728 26.624-26.624s-10.752-24.576-29.696-24.576H483.328c-18.944 0-29.696 7.68-29.696 24.576 2.048 18.944 9.728 26.624 26.624 26.624h41.472V583.68c.512 20.992 11.776 33.792 32.256 33.792zm389.632-395.264-141.312-82.944c-11.776-6.656-27.136-3.072-33.792 8.704-7.168 11.776-3.072 27.136 8.704 33.792l141.312 82.944c12.288 7.168 19.456 19.968 19.456 34.304v424.448c0 14.336-7.168 27.648-18.944 33.792-1.024.512-2.048 1.024-3.072 2.048-11.264-9.728-26.112-15.872-42.496-15.872-35.84 0-65.536 29.184-65.536 65.536 0 35.84 29.184 65.536 65.536 65.536s65.536-29.184 65.536-65.536c0-2.048 0-4.096-.512-6.144 1.536-.512 3.072-1.024 4.096-1.536 27.648-14.848 44.544-44.544 44.544-77.312V299.52c.512-32.256-15.872-60.928-43.52-77.312zm-212.48 647.168-179.2 99.84c-12.288 6.656-27.136 6.656-38.912 0L145.408 757.248c-11.264-6.144-18.944-19.456-18.944-33.792V611.84c23.552-9.728 40.448-33.28 40.448-60.416 0-35.84-29.184-65.536-65.536-65.536-35.84 0-65.536 29.184-65.536 65.536 0 27.136 16.896 50.688 40.448 60.416v111.616c0 32.256 16.896 61.952 44.032 76.8l367.616 211.968c13.824 7.68 28.672 11.264 43.52 11.264 14.848 0 30.208-3.584 44.032-11.264l179.2-99.84c11.776-6.656 16.384-21.504 9.728-33.792-6.144-11.776-21.504-15.872-33.28-9.216zM101.888 424.448c13.824 0 24.576-11.264 24.576-24.576v-99.84c0-13.824 7.168-26.624 19.456-33.792L512.512 54.784c12.288-6.656 27.136-6.656 38.912 0l53.248 30.72c0 2.048-.512 4.096-.512 6.144 0 35.84 29.184 65.536 65.536 65.536S735.232 128 735.232 91.648s-29.184-65.536-65.536-65.536c-15.872 0-30.72 5.632-41.984 15.36l-52.224-30.208c-27.136-14.848-59.904-14.848-87.552 0L120.32 223.232c-27.136 16.384-43.52 45.056-43.52 76.8v99.84c0 13.824 11.264 24.576 25.088 24.576z" />
  </svg>
);
const Memo = memo(SvgRtcOutlined);
export default Memo;
