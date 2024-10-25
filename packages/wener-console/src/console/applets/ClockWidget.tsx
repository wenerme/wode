import React from 'react';
import { PiClockLight } from 'react-icons/pi';
import { getWindowDragHandleClassname } from '../../window';
import { Clock } from './Clock/Clock';
import { defineApplet } from './defineApplet';

export const ClockWidget = defineApplet({
  name: 'clock',
  title: '时间',
  window: {
    width: 300,
    height: 370,
    canResize: false,
    frameless: true,
    icon: <PiClockLight />,
    render: () => {
      return <Clock className={getWindowDragHandleClassname()} />;
    },
  },
});
