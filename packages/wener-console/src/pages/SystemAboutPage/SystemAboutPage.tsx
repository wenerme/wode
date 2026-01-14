import type { ComponentPropsWithoutRef, ComponentPropsWithRef, FC, ReactNode } from 'react';
import { GrSystem } from 'react-icons/gr';
import type { BuildInfo } from '../../buildinfo';
import { getBuildInfo } from '../../buildinfo';
import { cn } from '../../utils/cn';
import { resolveWithDefault } from '../../utils/resolveWithDefault';
import { SystemAboutPageAuthorInfo, type SystemAboutPageAuthorInfoProps } from './SystemAboutPageAuthorInfo';
import { SystemAboutPageBrowserInfo } from './SystemAboutPageBrowserInfo';
import { SystemAboutPageBuildInfo, type SystemAboutPageBuildInfoProps } from './SystemAboutPageBuildInfo';
import { SystemAboutPageSection } from './SystemAboutPageSection';

export namespace SystemAboutPage {
	export type CompositeProps = ComponentPropsWithRef<'div'> & {
		children?: ReactNode;
		build?: boolean | (Omit<SystemAboutPageBuildInfoProps, 'info'> & { info?: BuildInfo });
		author?: boolean | SystemAboutPageAuthorInfoProps;
		agent?: boolean | ReactNode;
	};

	export const Layout: FC<ComponentPropsWithoutRef<'div'>> = ({ children, className, ...props }) => {
		return (
			<div className={cn('mx-auto mt-8 flex max-w-prose flex-col gap-8', className)} {...props}>
				{children}
			</div>
		);
	};

	export const Composite: FC<CompositeProps> = ({ children, build, author, agent, ...props }) => {
		const buildProps = resolveWithDefault(build, {
			title: '控制台',
			logo: <GrSystem className={'h-6 w-6'} />,
			info: getBuildInfo(),
		});

		const authorProps = resolveWithDefault(author, {});

		const agentNode = resolveWithDefault(agent, <SystemAboutPageBrowserInfo />);

		return (
			<Layout {...props}>
				{buildProps && <SystemAboutPageBuildInfo {...buildProps} info={buildProps.info ?? getBuildInfo()} />}
				{authorProps && <SystemAboutPageAuthorInfo {...authorProps} />}
				{agentNode}
				{children}
			</Layout>
		);
	};

	export const AuthorInfo = SystemAboutPageAuthorInfo;
	export const BuildInfo = SystemAboutPageBuildInfo;
	export const BrowserInfo = SystemAboutPageBrowserInfo;
	export const Section = SystemAboutPageSection;
}
