import { useEffect, type FC, type ReactNode } from 'react';
import { BiError, BiLogoChrome } from 'react-icons/bi';
import { GrDocumentMissing } from 'react-icons/gr';
import { HiMiniArrowLeft, HiMiniArrowPath, HiMiniHome, HiOutlineExclamationCircle } from 'react-icons/hi2';
import { useInRouterContext, useNavigate, useRouteError } from 'react-router';
import { ActionIcon } from '../../components/icons';
import { Button, NonIdealState } from '../../daisy';

export namespace NonIdealPage {
	export interface LayoutProps {
		icon?: ReactNode;
		title?: ReactNode;
		description?: ReactNode;
		action?: ReactNode;
		children?: ReactNode;
	}

	export const Layout: FC<LayoutProps> = ({ title, icon, description, action, children }) => {
		const inRouterContext = useInRouterContext();
		let navigate = (v: any) => {
			typeof v === 'string' ? (window.location.href = v) : window.history.back();
		};
		if (inRouterContext) {
			navigate = useNavigate();
		}

		const defaultAction = (
			<div className={'flex gap-2 opacity-95'}>
				<Button
					className={'btn-outline btn-sm'}
					onClick={() => {
						navigate('/');
					}}
				>
					<HiMiniHome className={'h-4 w-4'} />
					首页
				</Button>
				<Button
					className={'btn-outline btn-sm'}
					onClick={() => {
						navigate(-1);
					}}
				>
					<HiMiniArrowLeft className={'h-4 w-4'} />
					返回
				</Button>
				<Button
					className={'btn-outline btn-sm'}
					onClick={() => {
						window.location.reload();
					}}
				>
					<HiMiniArrowPath className={'h-4 w-4'} />
					刷新
				</Button>
			</div>
		);

		return (
			<div className={'flex h-full flex-1 items-center justify-center'}>
				<NonIdealState icon={icon} title={title} description={description} action={action ?? defaultAction}>
					{children}
				</NonIdealState>
			</div>
		);
	};

	export const PageNotFound: FC<{ children?: ReactNode }> = ({ children }) => {
		return (
			<Layout
				icon={<GrDocumentMissing className={'h-12 w-12'} />}
				title={'页面不存在'}
				description={<small suppressHydrationWarning>当前页面地址: {globalThis.location?.href}</small>}
			>
				{children}
			</Layout>
		);
	};

	export const ServerError: FC<{ statusCode?: string; children?: ReactNode }> = ({ statusCode, children }) => {
		return (
			<Layout
				icon={<BiError className={'h-12 w-12'} />}
				title={`服务器处理错误`}
				description={<small>错误码：{statusCode || '未知'}</small>}
			>
				{children}
			</Layout>
		);
	};

	export const PageError: FC<{
		error?: any;
		title?: ReactNode;
		children?: ReactNode;
		onReset?: () => void;
	}> = ({ error, title = '页面出错啦!', onReset, children }) => {
		const inRouterContext = useInRouterContext();
		let navigate = (v: any) => {
			typeof v === 'string' ? (window.location.href = v) : window.history.back();
		};
		if (inRouterContext) {
			navigate = useNavigate();
			const routerError = useRouteError();
			error ||= routerError;
		}

		useEffect(() => {
			console.error('PageError', error);
		}, [error]);

		const action = (
			<div className={'flex gap-2 opacity-95'}>
				{onReset && (
					<Button
						className={'btn-outline btn-sm'}
						onClick={() => {
							onReset();
						}}
					>
						<ActionIcon.Reset className={'h-4 w-4'} />
						重置
					</Button>
				)}
				<Button
					className={'btn-outline btn-sm'}
					onClick={() => {
						navigate('/');
					}}
				>
					<ActionIcon.Home className={'h-4 w-4'} />
					首页
				</Button>
				<Button
					className={'btn-outline btn-sm'}
					onClick={() => {
						navigate(-1);
					}}
				>
					<ActionIcon.Backward className={'h-4 w-4'} />
					返回
				</Button>
				<Button
					className={'btn-outline btn-sm'}
					onClick={() => {
						window.location.reload();
					}}
				>
					<ActionIcon.Refresh className={'h-4 w-4'} />
					刷新
				</Button>
				{children}
			</div>
		);

		return (
			<Layout
				icon={<HiOutlineExclamationCircle className={'h-12 w-12'} />}
				title={title}
				description={
					<div>
						<div>请联系管理员或刷新页面</div>
						<div>
							<Browser />
						</div>
						{error && (
							<details>
								<summary>查看详细错误</summary>
								<pre>{String(error)}</pre>
							</details>
						)}
					</div>
				}
				action={action}
			/>
		);
	};
}

const Browser = () => {
	const { brand, version } = navigator.userAgent.match(/(?<brand>Chrom(e|ium))\/(?<version>[0-9]+)\./)?.groups ?? {};
	if (!brand) {
		return <small className={'text-warning text-xs opacity-75'}>不支持的浏览器环境</small>;
	}

	// 100  2022-03-29
	// 90   2021-02-28
	const old = Number.parseInt(version, 10) < 100;

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
