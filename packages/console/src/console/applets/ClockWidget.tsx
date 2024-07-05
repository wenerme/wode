import React from 'react';
import { PiClockLight } from 'react-icons/pi';
import { Clock } from '@/console/applets/Clock/Clock';
import { defineApplet } from '@/console/applets/defineApplet';
import { getWindowDragHandleClassname } from '@/web/window';

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
