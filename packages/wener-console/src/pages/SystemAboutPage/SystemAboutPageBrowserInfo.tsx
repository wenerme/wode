import React, { type FC } from 'react';
import { useWindowEventListener } from '@wener/reaction';
import { useImmer } from 'use-immer';
import { useUserAgentPreferences } from '../../utils/UserAgentPreference';
import { SystemAboutPageSection } from './SystemAboutPageSection';

export const SystemAboutPageBrowserInfo: FC = () => {
	const getState = () => ({
		ua: globalThis.navigator?.userAgent,
		width: globalThis.outerWidth,
		height: globalThis.outerHeight,
		screenWidth: globalThis.screen?.width,
		screenHeight: globalThis.screen?.height,
		timezone: Intl.DateTimeFormat?.().resolvedOptions?.()?.timeZone,
	});
	const [state, update] = useImmer(getState);
	useWindowEventListener({
		resize: () => {
			update(getState());
		},
	});
	const { colorTheme, devicePixelRatio, reducedTransparency, reducedData, reducedMotion, contrast } =
		useUserAgentPreferences();
	return (
		<SystemAboutPageSection title='当前客户端系统信息' className={'text-sm'}>
			<article className={'prose'}>
				<div className={'flex flex-col'}>
					<small>
						窗口: {state.width}×{state.height} <br />
						屏幕: {state.screenWidth}×{state.screenHeight} @{devicePixelRatio}x <br />
					</small>
					<small>{state.ua}</small>
					<details>
						<summary className={'btn-link text-sm'}>更多信息</summary>
						<small>
							<div>偏好主题: {colorTheme}</div>
							<div>语言: {navigator.language}</div>
							<div>时区: {state.timezone}</div>
							<div>设备像素比: {devicePixelRatio}</div>
							<div>对比度: {contrast}</div>
							<div>
								{[
									reducedData && 'Reduced Data',
									reducedMotion && 'Reduced Motion',
									reducedTransparency && 'Reduced Transparency',
								]
									.filter(Boolean)
									.join(' ')}
							</div>
						</small>
					</details>
				</div>
			</article>
		</SystemAboutPageSection>
	);
};
