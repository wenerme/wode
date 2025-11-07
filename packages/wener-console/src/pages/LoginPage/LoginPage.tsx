import React, { type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { GrSystem } from 'react-icons/gr';
import { LoginPageFooter } from './LoginPageFooter';
import { LoginPageForm, type LoginFormData } from './LoginPageForm';
import { LoginPageHeader } from './LoginPageHeader';
import { LoginPageHero } from './LoginPageHero';
import { LoginPageLayout } from './LoginPageLayout';
import { LoginPageSocialLogin } from './LoginPageSocialLogin';
import { UserAgentSummary } from './UserAgentSummary';

export namespace LoginPage {
	export type FormData = LoginFormData;
	export type LinkProps = {
		url?: string;
		text?: string;
	};

	export interface CompositeProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title' | 'onSubmit'> {
		onSubmit?: (data: LoginFormData) => void;
		defaultValues?: Partial<LoginFormData>;
		title?: string;
		subtitle?: ReactNode;
		showOrg?: boolean;
		hero?: ReactNode;
		logo?: ReactNode;

		onForgetPassword?: () => void;
		onRegister?: () => void;

		socials?: Array<{
			name: string;
			icon?: ReactNode;
			onClick: () => void;
		}>;

		footer?: {
			policy?: LinkProps;
			terms?: LinkProps;
			beian?: LinkProps;
		};
	}
	export const Composite = ({
		onSubmit = () => undefined,
		hero,
		children,
		defaultValues,
		showOrg,
		title,
		subtitle = '登录系统',
		socials,
		footer: { policy, terms, beian } = {},
		logo = <GrSystem className={'h-10 w-10'} />,
		className,
		onForgetPassword,
		onRegister,
		...props
	}: CompositeProps) => {
		const content = (
			<>
				<LoginPageForm
					onSubmit={onSubmit}
					defaultValues={defaultValues}
					showOrg={showOrg}
					orgValue={title}
					onForgetPassword={onForgetPassword}
					onRegister={onRegister}
				/>
				{socials && <LoginPageSocialLogin socials={socials} />}
				{children}
			</>
		);

		const footer = (
			<>
				<LoginPageFooter policy={policy} terms={terms} beian={beian} className={'relative'} />
				<UserAgentSummary />
			</>
		);

		return (
			<LoginPageLayout
				className={className}
				header={<LoginPageHeader logo={logo} title={title} subtitle={subtitle} onRegister={onRegister} />}
				content={content}
				footer={footer}
				hero={hero}
				{...props}
			/>
		);
	};
	export const Form = LoginPageForm;
	export const Header = LoginPageHeader;
	export const Hero = LoginPageHero;
	export const SocialLogin = LoginPageSocialLogin;
	export const Layout = LoginPageLayout;
	export const Footer = LoginPageFooter;
}
