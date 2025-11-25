import React from 'react';
import { GrSystem } from 'react-icons/gr';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Image } from '../../components';
import { LoginPage } from './LoginPage';

const meta: Meta<typeof LoginPage.Composite> = {
	title: 'pages/LoginPage',
	component: LoginPage.Composite,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		(Story) => (
			<div className='h-screen'>
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof LoginPage.Composite>;

export const Default: Story = {
	args: {
		title: '系统登录',
		subtitle: '登录系统',
		onSubmit: (data) => {
			console.log('Login data:', data);
		},
	},
};

export const WithHero: Story = {
	args: {
		title: '系统登录',
		subtitle: '登录系统',
		hero: (
			<Image
				className='absolute inset-0 h-full w-full object-cover'
				src={'https://images.unsplash.com/photo-1496917756835-20cb06e75b4e'}
				alt={'splash'}
			/>
		),
		onSubmit: (data) => {
			console.log('Login data:', data);
		},
	},
};

export const WithOrg: Story = {
	args: {
		title: '企业名称',
		subtitle: '登录系统',
		showOrg: true,
		onSubmit: (data) => {
			console.log('Login data:', data);
		},
	},
};

export const WithSocialLogin: Story = {
	args: {
		title: '系统登录',
		subtitle: '登录系统',
		socials: [
			{
				name: 'Wechat',
				onClick: () => {
					console.log('Wechat login');
				},
			},
			{
				name: 'Wecom',
				onClick: () => {
					console.log('Wecom login');
				},
			},
		],
		onSubmit: (data) => {
			console.log('Login data:', data);
		},
	},
};

export const WithFooter: Story = {
	args: {
		title: '系统登录',
		subtitle: '登录系统',
		footer: {
			policy: {
				text: '隐私政策',
				url: 'https://example.com/policy',
			},
			terms: {
				text: '服务条款',
				url: 'https://example.com/terms',
			},
			beian: {
				text: '沪ICP备123456号',
				url: 'https://beian.miit.gov.cn/',
			},
		},
		onSubmit: (data) => {
			console.log('Login data:', data);
		},
	},
};

export const WithRegister: Story = {
	args: {
		title: '系统登录',
		subtitle: '登录系统',
		onRegister: () => {
			console.log('Register clicked');
		},
		onForgetPassword: () => {
			console.log('Forget password clicked');
		},
		onSubmit: (data) => {
			console.log('Login data:', data);
		},
	},
};

export const FullFeatured: Story = {
	args: {
		title: '企业管理系统',
		subtitle: '欢迎回来',
		logo: <GrSystem className={'h-10 w-10'} />,
		showOrg: true,
		socials: [
			{
				name: 'Wechat',
				onClick: () => {
					console.log('Wechat login');
				},
			},
			{
				name: 'Wecom',
				onClick: () => {
					console.log('Wecom login');
				},
			},
		],
		footer: {
			policy: {
				text: '隐私政策',
				url: 'https://example.com/policy',
			},
			terms: {
				text: '服务条款',
				url: 'https://example.com/terms',
			},
			beian: {
				text: '沪ICP备123456号',
				url: 'https://beian.miit.gov.cn/',
			},
		},
		onRegister: () => {
			console.log('Register clicked');
		},
		onForgetPassword: () => {
			console.log('Forget password clicked');
		},
		hero: (
			<Image
				className='absolute inset-0 h-full w-full object-cover'
				src={'https://images.unsplash.com/photo-1496917756835-20cb06e75b4e'}
				alt={'splash'}
			/>
		),
		onSubmit: (data) => {
			console.log('Login data:', data);
		},
	},
};

// Stories for individual components
export const LoginFormStory: Story = {
	render: () => {
		return (
			<div className='mx-auto max-w-md p-8'>
				<LoginPage.Form
					onSubmit={(data) => {
						console.log('Login data:', data);
					}}
				/>
			</div>
		);
	},
};

export const LoginFormWithOrgStory: Story = {
	render: () => {
		return (
			<div className='mx-auto max-w-md p-8'>
				<LoginPage.Form
					showOrg
					orgValue='企业名称'
					onSubmit={(data) => {
						console.log('Login data:', data);
					}}
				/>
			</div>
		);
	},
};

export const HeroStory: Story = {
	render: () => {
		return (
			<div className='h-screen'>
				<LoginPage.Hero>
					<Image
						className='absolute inset-0 h-full w-full object-cover'
						src={'https://images.unsplash.com/photo-1496917756835-20cb06e75b4e'}
						alt={'splash'}
					/>
				</LoginPage.Hero>
			</div>
		);
	},
};

export const SocialLoginStory: Story = {
	render: () => {
		return (
			<div className='mx-auto max-w-md p-8'>
				<LoginPage.SocialLogin
					socials={[
						{
							name: 'Wechat',
							onClick: () => {
								console.log('Wechat login');
							},
						},
						{
							name: 'Wecom',
							onClick: () => {
								console.log('Wecom login');
							},
						},
					]}
				/>
			</div>
		);
	},
};
