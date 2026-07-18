import { ErrorSuspenseBoundary } from '@wener/reaction';
import React from 'react';
import { Outlet, type RouteObject } from 'react-router';
import { UserProfilePage } from '../pages/UserProfilePage';

export default {
	element: (
		<ErrorSuspenseBoundary>
			<UserProfilePage>
				<Outlet />
			</UserProfilePage>
		</ErrorSuspenseBoundary>
	),
} satisfies RouteObject;
