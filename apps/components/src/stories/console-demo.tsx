'use client';

import { Command, UserPlus } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router';
import { LoginPage } from '../../registry/default/blocks/login-page';
import {
	createWindowManagerStore,
	WindowManagerHost,
	WindowManagerProvider,
} from '../../registry/default/blocks/window-manager';
import { ConsoleWorkspaceDemo } from './ConsoleWorkspaceDemo';
import { renderConsoleDemoWindow, renderConsoleDemoWindowIcon } from './console-demo-content';
import { ConsoleDemoDataProvider } from './console-demo-data-runtime';
import type { ConsoleDemoPartition } from './console-demo-database';
import { getPageFromPath, getPagePath, pagePaths, type RoutedDemoPage } from './console-demo-navigation';

export type ConsoleDemoScreen = 'login' | 'register' | 'console';

export type ConsoleDemoProps = {
	dataPartition?: ConsoleDemoPartition;
	initialPage?: RoutedDemoPage;
	initialScreen?: ConsoleDemoScreen;
	resetDataOnMount?: boolean;
};

type MockAccount = {
	email: string;
	name: string;
	password: string;
};

export function ConsoleDemo({
	dataPartition = 'automation',
	initialPage = 'home',
	initialScreen = 'login',
	resetDataOnMount = dataPartition === 'automation',
}: ConsoleDemoProps) {
	const [screen, setScreen] = useState(initialScreen);
	const [account, setAccount] = useState<MockAccount>({
		email: 'demo@example.com',
		name: '演示用户',
		password: 'storybook-demo',
	});
	const [authError, setAuthError] = useState<string>();
	if (screen === 'login') {
		return (
			<LoginPage.Composite
				title='Wener Console'
				subtitle='登录工作区'
				logo={<ConsoleDemoLogo />}
				formMode='email'
				defaultValues={{ email: account.email }}
				formLabels={{ email: '邮箱', submit: '登录', submitting: '登录中' }}
				onRegister={() => {
					setAuthError(undefined);
					setScreen('register');
				}}
				onSubmit={async (values) => {
					if (values.email !== account.email || values.password !== account.password) {
						setAuthError('邮箱或密码不正确');
						return;
					}
					setAuthError(undefined);
					setScreen('console');
				}}
				social={null}
				footerLinks={{ terms: { text: '服务条款', url: '#terms' }, policy: { text: '隐私政策', url: '#privacy' } }}
			>
				{authError ? (
					<div role='alert' className='alert alert-error mt-4 text-sm'>
						{authError}
					</div>
				) : null}
			</LoginPage.Composite>
		);
	}
	if (screen === 'register') {
		return (
			<LoginPage.Composite
				title='Wener Console'
				subtitle='创建工作区账号'
				logo={<ConsoleDemoLogo />}
				headerLabels={{ registerPrompt: '已有账号？', registerAction: '返回登录' }}
				onRegister={() => setScreen('login')}
				form={
					<RegistrationForm
						onSubmit={(nextAccount) => {
							setAccount(nextAccount);
							setAuthError(undefined);
							setScreen('console');
						}}
					/>
				}
				social={null}
				footerLinks={{ terms: { text: '服务条款', url: '#terms' }, policy: { text: '隐私政策', url: '#privacy' } }}
			/>
		);
	}
	return (
		<ConsoleDemoWorkspace
			dataPartition={dataPartition}
			initialPage={initialPage}
			resetDataOnMount={resetDataOnMount}
			userEmail={account.email}
			userName={account.name}
			onSignOut={() => setScreen('login')}
		/>
	);
}

function ConsoleDemoWorkspace({
	dataPartition,
	initialPage,
	resetDataOnMount,
	userEmail,
	userName,
	onSignOut,
}: Required<Pick<ConsoleDemoProps, 'dataPartition' | 'initialPage' | 'resetDataOnMount'>> & {
	userEmail: string;
	userName: string;
	onSignOut: () => void;
}) {
	const [store] = useState(() =>
		createWindowManagerStore({
			workspace: { width: 1440, height: 900, dock: { position: 'right', size: 58 } },
		}),
	);
	return (
		<ConsoleDemoDataProvider partition={dataPartition} resetOnMount={resetDataOnMount}>
			<MemoryRouter
				initialEntries={[pagePaths[initialPage]]}
				future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
			>
				<RoutedConsoleRuntime store={store} userEmail={userEmail} userName={userName} onSignOut={onSignOut} />
			</MemoryRouter>
		</ConsoleDemoDataProvider>
	);
}

function RoutedConsoleRuntime({
	store,
	userEmail,
	userName,
	onSignOut,
}: {
	store: ReturnType<typeof createWindowManagerStore>;
	userEmail: string;
	userName: string;
	onSignOut: () => void;
}) {
	const location = useLocation();
	const navigate = useNavigate();
	const page = getPageFromPath(location.pathname);
	return (
		<WindowManagerProvider store={store}>
			<WindowManagerHost
				className='h-svh min-h-[36rem]'
				dockProps={{
					user: {
						displayName: userName,
						hasNotification: true,
						initials: getInitials(userName),
						loginName: userEmail,
						onOpenProfile: () => navigate(pagePaths.preferences),
						onSignOut,
					},
				}}
				background={
					<div className='absolute inset-y-0 right-[58px] left-0'>
						<ConsoleWorkspaceDemo
							enableWorkspace
							activePage={page}
							hrefForPage={getPagePath}
							onPageChange={(next) => navigate(getPagePath(next))}
							showUtilityDock={false}
							userName={userName}
						/>
					</div>
				}
				renderContent={renderConsoleDemoWindow}
				renderIcon={renderConsoleDemoWindowIcon}
			/>
		</WindowManagerProvider>
	);
}

function getInitials(name: string) {
	return Array.from(name.trim()).slice(0, 2).join('').toUpperCase() || '用户';
}

function RegistrationForm({ onSubmit }: { onSubmit: (account: MockAccount) => void }) {
	const submit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const data = new FormData(event.currentTarget);
		onSubmit({
			name: String(data.get('name') || '演示用户'),
			email: String(data.get('email') || ''),
			password: String(data.get('password') || ''),
		});
	};
	return (
		<form className='mt-8 space-y-4' onSubmit={submit}>
			<label className='form-control block'>
				<span className='label mb-1.5 px-0 text-sm font-medium'>姓名</span>
				<input className='input input-bordered w-full' name='name' autoComplete='name' defaultValue='林澄' required />
			</label>
			<label className='form-control block'>
				<span className='label mb-1.5 px-0 text-sm font-medium'>工作邮箱</span>
				<input
					className='input input-bordered w-full'
					name='email'
					type='email'
					autoComplete='email'
					defaultValue='lin@example.com'
					required
				/>
			</label>
			<label className='form-control block'>
				<span className='label mb-1.5 px-0 text-sm font-medium'>密码</span>
				<input
					className='input input-bordered w-full'
					name='password'
					type='password'
					autoComplete='new-password'
					defaultValue='registered-demo'
					minLength={8}
					required
				/>
			</label>
			<label className='flex items-start gap-2 text-sm'>
				<input type='checkbox' className='checkbox checkbox-sm mt-0.5' defaultChecked required />
				<span>我已阅读并同意服务条款与隐私政策</span>
			</label>
			<button type='submit' className='btn btn-neutral w-full'>
				<UserPlus aria-hidden='true' className='size-4' />
				注册并创建工作区
			</button>
		</form>
	);
}

function ConsoleDemoLogo() {
	return (
		<span className='bg-neutral text-neutral-content grid size-10 place-items-center rounded-md'>
			<Command aria-hidden='true' className='size-5' />
		</span>
	);
}
