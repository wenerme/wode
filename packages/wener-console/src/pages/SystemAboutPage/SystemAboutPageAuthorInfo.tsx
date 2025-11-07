import React, { type FC } from 'react';
import { Button } from '../../daisy';
import { SystemAboutPageSection } from './SystemAboutPageSection';

export interface SystemAboutPageAuthorInfoProps {
	title?: string;
	author?: {
		name?: string;
		link?: string;
	};
}

export const SystemAboutPageAuthorInfo: FC<SystemAboutPageAuthorInfoProps> = (props) => {
	const { title = '控制台', author: { name = 'Wener', link = 'https://wener.me' } = {} } = props;
	return (
		<SystemAboutPageSection title={title} className={'text-sm'}>
			<article className={'prose'}>
				<small>
					由{' '}
					<Button href={link} size={'xs'} className={'btn-link'} target={'_blank'}>
						{name}
					</Button>{' '}
					提供技术支持。
				</small>
			</article>
		</SystemAboutPageSection>
	);
};
