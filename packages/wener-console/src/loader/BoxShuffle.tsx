import type { FC, ReactNode } from 'react';
import styled from '@emotion/styled';
import { darken } from 'polished';

const cbox = (props: any) => `
position: absolute;
top: 50%;
left: 50%;
transform: translate(-50%, -50%);
`;

const BoxShuffleContainer = styled.div<{ size?: string; colors?: string[] }>`
  --size: ${(props: BoxShuffleProps) => props.size || '3em'};
  position: relative;
  min-height: 180px;
  min-width: 180px;
  transform: translateX(-50%);
  display: inline-block;

  .container {
    ${cbox};
    transform-style: preserve-3d;
    perspective: 2000px;
    transform: rotateX(-30deg) rotateY(-45deg);

    *,
    *:before,
    *:after {
      box-sizing: border-box;
    }
  }

  .holder {
    ${cbox};
    transform-style: preserve-3d;
    transform: translate3d(0em, var(--size), calc(var(--size) * 0.5));

    &:nth-child(3) {
      transform: rotateY(-90deg) rotateX(90deg) translate3d(0, var(--size), calc(var(--size) * 0.5));
    }

    &:first-child {
      transform: rotateZ(-90deg) rotateX(-90deg) translate3d(0, var(--size), calc(var(--size) * 0.5));
    }
  }

  .box {
    ${cbox};
    transform-style: preserve-3d;
    animation: ani-box 6s infinite;
    width: var(--size);
    height: var(--size);
    //opacity: .9;

    &:before,
    &:after {
      position: absolute;
      width: 100%;
      height: 100%;
      content: '';
    }

    &:before {
      left: 100%;
      bottom: 0;
      transform: rotateY(90deg);
      transform-origin: 0 50%;
    }

    &:after {
      left: 0;
      bottom: 100%;
      transform: rotateX(90deg);
      transform-origin: 0 100%;
    }
  }

  .info {
    ${cbox};
    padding-top: 180px;

    .title {
      font-size: 20px;
      font-weight: 400;
      text-align: center;
      color: #212121;
    }

    .detail {
      font-size: 14px;
      font-weight: 200;
      text-align: center;
    }
  }

  @keyframes ani-box {
    8.33% {
      transform: translate3d(-50%, -50%, 0) scaleZ(2);
    }
    16.7% {
      transform: translate3d(-50%, -50%, calc(-1 * var(--size))) scaleZ(1);
    }
    25% {
      transform: translate3d(-50%, -100%, calc(-1 * var(--size))) scaleY(2);
    }
    33.3% {
      transform: translate3d(-50%, -150%, calc(-1 * var(--size))) scaleY(1);
    }
    41.7% {
      transform: translate3d(-100%, -150%, calc(-1 * var(--size))) scaleX(2);
    }
    50% {
      transform: translate3d(-150%, -150%, calc(-1 * var(--size))) scaleX(1);
    }
    58.3% {
      transform: translate3d(-150%, -150%, 0) scaleZ(2);
    }
    66.7% {
      transform: translate3d(-150%, -150%, 0) scaleZ(1);
    }
    75% {
      transform: translate3d(-150%, -100%, 0) scaleY(2);
    }
    83.3% {
      transform: translate3d(-150%, -50%, 0) scaleY(1);
    }
    91.7% {
      transform: translate3d(-100%, -50%, 0) scaleX(2);
    }
    100% {
      transform: translate3d(-50%, -50%, 0) scaleX(1);
    }
  }
  ${(props: BoxShuffleProps) =>
    (props.colors || ['#1FBCD3', '#CBE2B4', '#F6B6CA']).map(
      (color, i) => `
    .holder:nth-child(${i + 1}){
      .box{
        background-color: ${color};
        &:before{
          background-color: ${darken(0.2, color)};
        }
        &:after{
          background-color: ${darken(0.1, color)};
        }
      }
    }
  }
`,
    )}
`;

export interface BoxShuffleProps {
  size?: string;
  title?: ReactNode;
  detail?: ReactNode;
  colors?: string[];
}

export const BoxShuffle: FC<BoxShuffleProps> = (props) => {
  const { title, detail, ...rest } = props;
  return (
    <BoxShuffleContainer {...rest}>
      <div className='container'>
        <div className='holder'>
          <div className='box' />
        </div>
        <div className='holder'>
          <div className='box' />
        </div>
        <div className='holder'>
          <div className='box' />
        </div>
      </div>
      <div className='info'>
        <div className='title'>{title}</div>
        <div className='detail'>{detail}</div>
      </div>
    </BoxShuffleContainer>
  );
};
