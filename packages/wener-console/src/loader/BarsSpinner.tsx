import type React from 'react';
import styled from '@emotion/styled';

const BarsSpinnerBox = styled.div<{ bars: number }>`
  position: relative;
  width: 35px;
  height: 35px;

  & > div {
    position: absolute;
    width: 2px;
    height: 8px;
    background-color: #25363f;
    opacity: 0.05;
    animation: fadeit 0.8s linear infinite;
  }

  ${({ bars }: { bars: number }) =>
    Array(bars)
      .fill(null)
      .map(
        (_, i) => `
  & > div:nth-child(${i + 1}) {
    transform: rotate(${((360 / bars) * i).toFixed(2)}deg) translate(0, -12px);
    animation-delay:${((0.8 / bars) * (i + 1)).toFixed(2)}s;
  }
  `,
      )} @keyframes fadeit {
    0% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
`;

export const BarsSpinner: React.FC<{ bars?: number }> = ({ bars = 16 }) => {
  return (
    <BarsSpinnerBox bars={bars}>
      {Array(bars)
        .fill(null)
        .map((_, i) => (
          <div key={i} />
        ))}
    </BarsSpinnerBox>
  );
};
