import React, { useEffect, type ReactNode } from 'react';
import { BiLogoChrome } from 'react-icons/bi';
import { HiOutlineExclamationCircle } from 'react-icons/hi2';
import { useInRouterContext, useNavigate, useRouteError } from 'react-router';
import { Button, NonIdealState } from '../daisy';
import { ActionIcon } from './icons';

export const PageErrorState = ({
	error,
	title = '页面出错啦!',
	onReset,
	children,
}: {
	error?: any;
	title?: ReactNode;
	children?: ReactNode;
	onReset?: () => void;
}) => {
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
	}, []);

	return (
		<NonIdealState
			icon={<HiOutlineExclamationCircle className={'h-12 w-12'} />}
			title={title}
			description={
				<div>
					<div>请联系管理员或刷新页面</div>
					<div>
						<Browser />
					</div>
					<details>
						<summary>查看详细错误</summary>
						<pre>{String(error)}</pre>
					</details>
				</div>
			}
			action={
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
			}
		/>
	);
};

const Browser = () => {
	const { brand, version } = navigator.userAgent.match(/(?<brand>Chrom(e|ium))\/(?<version>[0-9]+)\./)?.groups ?? {};
	if (!brand) {
		return <small className={'text-warning text-xs opacity-75'}>不支持的浏览器环境</small>;
	}

	// 100  2022-03-29
	// 90   2021-02-28
	const old = Number.parseInt(version) < 100;

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
