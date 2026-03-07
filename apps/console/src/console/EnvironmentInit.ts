import { defineInit } from '@wener/common/meta';
import React from 'react';

export const EnvironmentInit = defineInit({
	name: 'Environment',
	onInit: () => {
		// avoid potential dependency
		window.React ||= React;
	},
});
