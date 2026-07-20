import { flexRender } from '@wener/reaction';
import { GrSystem } from 'react-icons/gr';
import { useContextStore } from '../hooks';
import type { SitePreferences } from '../web/prefs';

export const SiteLogo = (props: any) => {
	const { useWatch } = useContextStore<SitePreferences>();
	const logo = useWatch('site.logo');
	return flexRender(logo || GrSystem, props, true);
};
