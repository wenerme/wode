import React, { type FC, type ReactNode } from 'react';
import { GrSystem } from 'react-icons/gr';
import { HiCheck } from 'react-icons/hi';
import { ImLab } from 'react-icons/im';
import { dayjs } from '@wener/common/dayjs';
import type { BuildInfo } from '../../buildinfo';
import { SystemAboutPageSection } from './SystemAboutPageSection';

export interface SystemAboutPageBuildInfoProps {
	logo?: ReactNode;
	title?: ReactNode;
	info: BuildInfo;
}

export const SystemAboutPageBuildInfo: FC<SystemAboutPageBuildInfoProps> = ({ logo, title, info }) => {
	return (
		<SystemAboutPageSection icon={logo || <GrSystem className={'h-6 w-6'} />} title={title} className={'p-0'}>
			<ul className={'divide-color flex flex-col divide-y [&>li]:flex [&>li]:items-center [&>li]:gap-2 [&>li]:p-3'}>
				<li>
					<div className={'flex h-8 w-8 items-center justify-center'}>
						<HiCheck className={'text-info h-4 w-4'} />
					</div>
					<div>
						<div className={'flex items-center gap-2'}>
							当前版本: {info.version}
							{info.isDev && (
								<span className={'badge badge-warning'}>
									<ImLab /> 测试版本
								</span>
							)}
						</div>
						<div className={'flex gap-2'}>
							<small className={'text-gray-600'}>构建于 {dayjs(info.date).format('YYYY.MM.DD HH.mm')}</small>
							{info.commit.shortSha && (
								<small className={'text-gray-300'}>
									{info.commit.shortSha}
									{info.commit.timestamp && <span>@{dayjs(info.commit.timestamp).format()}</span>}
								</small>
							)}
						</div>
					</div>
				</li>
			</ul>
		</SystemAboutPageSection>
	);
};
