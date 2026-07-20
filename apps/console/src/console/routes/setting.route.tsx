import { ErrorSuspenseBoundary } from '@wener/reaction';
import React from 'react';
import { Outlet, type RouteObject } from 'react-router-dom';
import SettingPage from '../pages/SettingPage';

export default {
	element: (
		<SettingPage>
			<ErrorSuspenseBoundary>
				<Outlet />
			</ErrorSuspenseBoundary>
		</SettingPage>
	),
} as RouteObject;
