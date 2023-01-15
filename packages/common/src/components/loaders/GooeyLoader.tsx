import type { HTMLAttributes } from 'react';
import React from 'react';
import styled from 'styled-components';

const GooeyLoaderContainer = styled.div`
  width: 200px;
  height: 200px;
  position: relative;
  transform: translate(-50%, -50%);
  margin: auto;
  filter: url('#gooey-loader-filter');
  animation: rotate-move 2s ease-in-out infinite;

  .dot {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    background-color: #000;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    margin: auto;
  }

  .dot-3 {
    background-color: #f74d75;
    animation: dot-3-move 2s ease infinite, index 6s ease infinite;
  }

  .dot-2 {
    background-color: #10beae;
    animation: dot-2-move 2s ease infinite, index 6s -4s ease infinite;
  }

  .dot-1 {
    background-color: #ffe386;
    animation: dot-1-move 2s ease infinite, index 6s -2s ease infinite;
  }

  @keyframes dot-3-move {
    20% {
      transform: scale(1);
    }
    45% {
      transform: translateY(-18px) scale(0.45);
    }
    60% {
      transform: translateY(-90px) scale(0.45);
    }
    80% {
      transform: translateY(-90px) scale(0.45);
    }
    100% {
      transform: translateY(0px) scale(1);
    }
  }

  @keyframes dot-2-move {
    20% {
      transform: scale(1);
    }
    45% {
      transform: translate(-16px, 12px) scale(0.45);
    }
    60% {
      transform: translate(-80px, 60px) scale(0.45);
    }
    80% {
      transform: translate(-80px, 60px) scale(0.45);
    }
    100% {
      transform: translateY(0px) scale(1);
    }
  }

  @keyframes dot-1-move {
    20% {
      transform: scale(1);
    }
    45% {
      transform: translate(16px, 12px) scale(0.45);
    }
    60% {
      transform: translate(80px, 60px) scale(0.45);
    }
    80% {
      transform: translate(80px, 60px) scale(0.45);
    }
    100% {
      transform: translateY(0px) scale(1);
    }
  }

  @keyframes rotate-move {
    55% {
      transform: translate(-50%, -50%) rotate(0deg);
    }
    80% {
      transform: translate(-50%, -50%) rotate(360deg);
    }
    100% {
      transform: translate(-50%, -50%) rotate(360deg);
    }
  }

  @keyframes index {
    0%,
    100% {
      z-index: 3;
    }
    33.3% {
      z-index: 2;
    }
    66.6% {
      z-index: 1;
    }
  }
`;

function loadSvgFilter() {
  if (typeof window === 'undefined') {
    return;
  }
  if (document.querySelector('#GooeyLoaderSvgFilter')) {
    return;
  }
  const el = document.createElement('div');
  el.id = 'GooeyLoaderSvgFilter';
  el.innerHTML = `
<svg xmlns='http://www.w3.org/2000/svg' version='1.1'>
  <defs>
    <filter id='gooey-loader-filter'>
      <feGaussianBlur in='SourceGraphic' stdDeviation='10' result='blur' />
      <feColorMatrix in='blur' mode='matrix' values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 21 -7'/>
    </filter>
  </defs>
</svg>
`;
  document.body.appendChild(el);
}

/**
 * GooeyLoader
 *
 * @see https://codepen.io/Izumenko/pen/MpWyXK
 */
export const GooeyLoader: React.FC<HTMLAttributes<HTMLDivElement>> = (props) => {
  loadSvgFilter();
  return (
    <GooeyLoaderContainer {...props}>
      <div className="dot dot-1" />
      <div className="dot dot-2" />
      <div className="dot dot-3" />
    </GooeyLoaderContainer>
  );
};
