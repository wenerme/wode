import { GrSystem } from 'react-icons/gr';
import { flexRender } from '@wener/reaction';
import { useContextStore } from '../../hooks';
import type { SitePreferences } from '../prefs';

export const SiteLogo = (props: any) => {
  const { useWatch } = useContextStore<SitePreferences>();
  const logo = useWatch('site.logo');
  return flexRender(logo || GrSystem, props, true);
};
