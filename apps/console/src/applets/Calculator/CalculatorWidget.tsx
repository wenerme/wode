import React, { lazy } from 'react';
import { PiCalculatorLight } from 'react-icons/pi';
import { defineApplet } from '@wener/console/console';

const Content = lazy(() => import('./Calculator').then((m) => ({ default: m.Calculator })));

export const CalculatorWidget = defineApplet({
  name: 'calculator',
  title: '计算器',
  window: {
    width: 330,
    height: 530,
    icon: <PiCalculatorLight />,
    render: () => {
      return <Content />;
    },
  },
});
