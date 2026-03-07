import { defineApplet } from '@wener/console/console';
import React, { lazy } from 'react';
import { PiHardHatLight } from 'react-icons/pi';

const Content = lazy(() => import('./Playground').then((m) => ({ default: m.Playground })));

export const PlaygroundWidget = defineApplet({
	name: 'playground',
	title: 'Playground',
	window: {
		width: 600,
		height: 400,
		icon: <PiHardHatLight />,
		render: () => {
			return <Content />;
		},
	},
});
