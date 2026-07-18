import React from 'react';
import type { RouteObject } from 'react-router';
import { SystemAboutPage } from '../../../../../packages/wener-console/src/pages';

export default {
	element: <SystemAboutPage />,
	handle: {
		title: '关于',
	},
} satisfies RouteObject;
