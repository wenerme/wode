import React from 'react';
import type { RouteObject } from 'react-router';
import { SystemAboutPage } from '@wener/console/pages';

export default {
	element: <SystemAboutPage.Composite />,
	handle: {
		title: '关于',
	},
} satisfies RouteObject;
