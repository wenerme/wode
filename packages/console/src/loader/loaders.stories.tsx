import React from 'react';
import { Meta } from '@storybook/react';
import { GradientSpinner, PlantRotating, PulseBubble, SolarSystemSpinner } from '@/loader/AlexWarnesCssLoader';
import { BarsSpinner } from '@/loader/BarsSpinner';
import { BoxShuffle } from '@/loader/BoxShuffle';
import { DotsFadeLoader } from '@/loader/DotsFadeLoader/DotsFadeLoader';
import { GooeyLoader } from '@/loader/GooeyLoader';

const meta: Meta = {
  title: 'web/loaders',
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

export const Demo = () => {
  return (
    <div className={'mx-auto p-6'}>
      <div className={'flex flex-col gap-2 [&_h3]:border-b [&_h3]:font-semibold'}>
        <h3>DotsFadeLoader</h3>
        <DotsFadeLoader />
        <h3>BarsSpinner</h3>
        <b>bars=16</b>
        <BarsSpinner />
        <b>bars=20</b>
        <BarsSpinner bars={20} />
        <h3>BoxShuffle</h3>
        <div className={'relative mx-auto h-[180px] w-[180px]'}>
          <BoxShuffle />
        </div>
        <cite>
          <a href='https://codepen.io/golle404/pen/EKOoyW' target='_blank' rel='noreferrer noopener'>
            CodePen
          </a>
        </cite>

        <h3>GooeyLoader</h3>

        <div className={'relative h-60 w-60'}>
          <GooeyLoader />
        </div>
        <cite>
          <a href='https://codepen.io/Izumenko/pen/MpWyXK' target='_blank' rel='noreferrer noopener'>
            CodePen
          </a>
        </cite>

        <h3>AlexWarnesCssLoader</h3>

        <div style={{ backgroundColor: '#37474f', padding: 100 }} className={'flex flex-col items-center text-white'}>
          <h3>GradientSpinner</h3>
          <GradientSpinner />
          <h3>SolarSystemSpinner</h3>
          <SolarSystemSpinner />
          <h3>PlanetRotatingBox</h3>
          <PlantRotating />
          <h3>PulseBubble</h3>
          <PulseBubble />
        </div>

        <cite>
          <a href='https://codepen.io/AlexWarnes/pen/jXYYKL' target='_blank' rel='noreferrer noopener'>
            AlexWarnes CSS Loading Animations @CodePen
          </a>
        </cite>
      </div>
    </div>
  );
};
