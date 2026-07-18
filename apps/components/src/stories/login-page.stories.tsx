'use client';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Boxes, Building2, Fingerprint, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { LoginPage, LoginPageComposite, type LoginPageFormValues } from '../../registry/default/blocks/login-page';

function FullLoginPageDemo() {
	const [status, setStatus] = useState('等待登录');
	const submit = async (values: LoginPageFormValues) => {
		setStatus('正在验证');
		await new Promise((resolve) => setTimeout(resolve, 250));
		setStatus(`已提交 ${values.org ? `${values.org} / ` : ''}${values.username ?? values.email}`);
	};

	return (
		<LoginPage.Composite
			aria-labelledby='full-login-title'
			title='Wener Console'
			subtitle='欢迎回来'
			headingId='full-login-title'
			logo={<Boxes className='text-primary size-8' />}
			showOrg
			orgValue='platform'
			defaultValues={{ username: 'operator', remember: true }}
			onSubmit={submit}
			onForgotPassword={() => setStatus('已请求密码恢复')}
			onRegister={() => setStatus('已请求创建账号')}
			socials={[
				{ name: 'Passkey', icon: <KeyRound className='size-4' />, onClick: () => setStatus('已请求 Passkey 登录') },
				{ name: '企业身份', icon: <Building2 className='size-4' />, onClick: () => setStatus('已请求企业身份登录') },
			]}
			footerLinks={{
				policy: { text: '隐私政策', url: '#privacy' },
				terms: { text: '服务条款', url: '#terms' },
				beian: { text: '沪ICP备123456号' },
			}}
			hero={<LoginHero />}
		>
			<p role='status' aria-live='polite' className='text-base-content/55 mt-5 text-center text-xs'>
				{status}
			</p>
		</LoginPage.Composite>
	);
}

function EmailLoginDemo() {
	const [status, setStatus] = useState('使用工作邮箱登录');
	return (
		<LoginPage.Composite
			aria-labelledby='email-login-title'
			title='Service Desk'
			subtitle='登录服务门户'
			headingId='email-login-title'
			logo={<Mail className='text-primary size-7' />}
			formMode='email'
			defaultValues={{ email: 'support@example.com' }}
			showRemember={false}
			onSubmit={(values) => setStatus(`已提交 ${values.email}`)}
			socialTitle='或者使用'
			socialColumns={1}
			socials={[
				{ name: '安全密钥', icon: <Fingerprint className='size-4' />, onClick: () => setStatus('已请求安全密钥登录') },
			]}
			footer={null}
		>
			<p role='status' aria-live='polite' className='text-base-content/55 mt-5 text-center text-xs'>
				{status}
			</p>
		</LoginPage.Composite>
	);
}

function CustomRegionsDemo() {
	const [status, setStatus] = useState('设备授权尚未开始');
	return (
		<LoginPage.Composite
			aria-labelledby='device-login-title'
			header={
				<LoginPage.Header
					title='Infrastructure Access'
					subtitle='授权当前设备'
					headingId='device-login-title'
					logo={<ShieldCheck className='text-success size-8' />}
					actions={<span className='text-base-content/45 text-xs'>Restricted</span>}
				/>
			}
			content={
				<div className='mt-8 space-y-4'>
					<div className='border-base-300 bg-base-200/35 rounded-md border p-4 font-mono text-sm'>WT-82K4-P9</div>
					<button
						type='button'
						className='bg-primary text-primary-content h-10 w-full rounded-md px-4 text-sm font-semibold'
						onClick={() => setStatus('设备授权请求已发送')}
					>
						授权设备
					</button>
					<p role='status' aria-live='polite' className='text-base-content/55 text-center text-xs'>
						{status}
					</p>
				</div>
			}
			footer={
				<LoginPage.Footer copyright='Wener Infrastructure' links={[{ text: '访问策略', url: '#access-policy' }]} />
			}
			hero={
				<LoginHero title='Private infrastructure' description='Device authorization is audited and time limited.' />
			}
		/>
	);
}

function LoginHero({
	title = 'Operate with context',
	description = 'A focused workspace for infrastructure, resources, and service operations.',
}: {
	title?: string;
	description?: string;
}) {
	return (
		<div className='absolute inset-0'>
			<img
				className='size-full object-cover'
				src='https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=85'
				alt='现代办公空间'
			/>
			<div className='absolute inset-0 bg-black/35' />
			<div className='absolute right-10 bottom-10 left-10 max-w-xl text-white'>
				<h2 className='text-2xl font-semibold'>{title}</h2>
				<p className='mt-2 max-w-lg text-sm leading-6 text-white/80'>{description}</p>
			</div>
		</div>
	);
}

const meta = {
	title: 'Blocks/Login Page',
	component: LoginPageComposite,
	tags: ['autodocs'],
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component:
					'A composable login page block with optional form and social conveniences. Authentication APIs, tokens, routing, MFA, captcha, and tenant resolution remain application concerns.',
			},
		},
	},
} satisfies Meta<typeof LoginPageComposite>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Composite: Story = {
	render: () => <FullLoginPageDemo />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const password = canvas.getByLabelText('密码', { exact: true });
		const remember = canvas.getByRole('checkbox', { name: '记住登录' });
		const submit = canvas.getByRole('button', { name: '登录' });

		await expect(remember).toBeChecked();
		await expect(submit).toBeDisabled();
		await userEvent.type(password, 'story-password');
		await expect(submit).toBeEnabled();
		await userEvent.click(canvas.getByRole('button', { name: '显示密码' }));
		await expect(password).toHaveAttribute('type', 'text');
		await userEvent.click(submit);
		await expect(submit).toBeDisabled();
		await canvas.findByText('已提交 platform / operator');
	},
};

export const EmailAndSocial: Story = {
	render: () => <EmailLoginDemo />,
};

export const CustomRegions: Story = {
	render: () => <CustomRegionsDemo />,
};
