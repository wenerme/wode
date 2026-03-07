import { useMounted } from '@wener/reaction';
import type { ComponentPropsWithoutRef, FC } from 'react';
import { BiLogoChrome } from 'react-icons/bi';
import { HiMiniLanguage } from 'react-icons/hi2';
import { MdDarkMode, MdLightMode } from 'react-icons/md';
import { cn } from '../../utils/cn';
import { getUserAgentPreferences } from '../../utils/UserAgentPreference';

export interface UserAgentSummaryProps extends ComponentPropsWithoutRef<'small'> {}

const UserAgentPrefers = () => {
	const { colorTheme, devicePixelRatio } = getUserAgentPreferences();
	return (
		<>
			{colorTheme === 'dark' && <MdDarkMode />}
			{colorTheme === 'light' && <MdLightMode />}
			{devicePixelRatio > 1 && <small>{devicePixelRatio}dppx</small>}
		</>
	);
};

const Lang = () => {
	return (
		<span className={'inline-flex items-center'}>
			<HiMiniLanguage />
			{navigator.language}
		</span>
	);
};

const Browser = () => {
	const { brand, version } = navigator.userAgent.match(/(?<brand>Chrom(e|ium))\/(?<version>[0-9]+)\./)?.groups ?? {};
	if (!brand) {
		return <small className={'text-error text-xs opacity-75'}>请使用新版本的 Chrome 浏览器</small>;
	}
	const old = parseInt(version, 10) < 100;

	return (
		<div className={'inline-flex items-center'}>
			<BiLogoChrome />
			{brand} {version}
			{old && (
				<small className={'text-warning text-xs opacity-75'}>
					当前浏览器版本 {version} 过低，请下载使用新版本浏览器。
				</small>
			)}
		</div>
	);
};

export const UserAgentSummary: FC<UserAgentSummaryProps> = ({ className, ...props }) => {
	const mounted = useMounted();
	if (!mounted) {
		return null;
	}

	return (
		<small className={cn('flex items-center gap-1 text-xs opacity-75', className)} {...props}>
			<Browser />
			<Lang />
			<UserAgentPrefers />
		</small>
	);
};
