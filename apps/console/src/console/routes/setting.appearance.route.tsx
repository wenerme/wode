import { AppearanceSettingPage } from '@wener/console/pages';
import React from 'react';
import type { RouteObject } from 'react-router';

export default {
	element: <AppearanceSettingPage.Composite />,
	handle: {
		title: '显示设置',
	},
} as RouteObject;
