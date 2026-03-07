import { type ComponentPropsWithoutRef, type FC, Fragment, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

type LinkProps = {
	url?: string;
	text?: string;
};

export interface FooterProps extends ComponentPropsWithoutRef<'footer'> {
	policy?: LinkProps;
	terms?: LinkProps;
	beian?: LinkProps;
}

function renderLink({ text, url }: { text?: string; url?: string }) {
	if (!text || !url) {
		return null;
	}
	return (
		<a href={url} target={'_blank'} rel='noopener noreferrer' className='hover:underline'>
			{text}
		</a>
	);
}

function joinNode(nodes: ReactNode[], join: ReactNode) {
	return nodes.filter(Boolean).map((n, i) => {
		const last = i >= nodes.length - 1;
		return (
			<Fragment key={i}>
				{n}
				{!last && join}
			</Fragment>
		);
	});
}

export const LoginPageFooter: FC<FooterProps> = ({ policy, terms, beian, className, ...props }) => {
	return (
		<div className={cn('text-center text-sm leading-6 opacity-80', className)} {...props}>
			{joinNode(
				[
					<span key='year'>© {new Date().getFullYear()}</span>,
					renderLink({ text: '隐私政策', ...policy }),
					renderLink({ text: '服务条款', ...terms }),
					renderLink({ url: 'https://beian.miit.gov.cn/', ...beian }),
				].filter(Boolean),
				<span className='mx-1'>•</span>,
			)}
		</div>
	);
};
