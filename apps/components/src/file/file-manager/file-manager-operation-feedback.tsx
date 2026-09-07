'use client';

import { CheckCircle2, RotateCcw, TriangleAlert, X } from 'lucide-react';
import { useFileManagerActions, useFileManagerStore } from './file-manager-context';
import {
	createFileManagerRetryOperation,
	formatFileManagerOperationError,
	getFileManagerOperationResultCount,
} from './file-manager-operation-utils';

export function FileManagerOperationFeedbackPanel() {
	const feedback = useFileManagerStore((state) => state.operation.feedback);
	const notice = useFileManagerStore((state) => state.operation.notice);
	const actions = useFileManagerActions();
	if (notice) {
		return (
			<section aria-label='拖放操作提示' className='border-warning/35 bg-warning/8 border-t' role='alert'>
				<div className='flex min-h-10 items-center gap-2 px-3 py-2 text-xs'>
					<TriangleAlert aria-hidden='true' className='text-warning size-4 shrink-0' />
					<span className='min-w-0 flex-1'>{notice}</span>
					<button
						type='button'
						aria-label='关闭拖放提示'
						title='关闭拖放提示'
						className='hover:bg-base-200 grid size-6 shrink-0 place-items-center rounded-sm'
						onClick={() => actions.setOperationNotice(undefined)}
					>
						<X aria-hidden='true' className='size-3.5' />
					</button>
				</div>
			</section>
		);
	}
	if (!feedback || feedback.operation.type === 'save-text') return null;
	const counts = getFileManagerOperationResultCount(feedback.result);
	const retry = createFileManagerRetryOperation(feedback);
	const failed = feedback.result?.failed ?? [];
	const failedItems = getFailedOperationItems(failed);
	const error = feedback.error ? formatFileManagerOperationError(feedback.error) : undefined;
	const unsuccessful = feedback.outcome !== 'succeeded' || counts.failed > 0;
	const summary = getFeedbackSummary(feedback.outcome, counts.completed, counts.failed);
	return (
		<section
			aria-label='文件操作结果'
			className={unsuccessful ? 'border-error/35 bg-error/6 border-t' : 'border-success/30 bg-success/6 border-t'}
			role={unsuccessful ? 'alert' : 'status'}
		>
			<div className='flex min-h-10 items-start gap-2 px-3 py-2 text-xs'>
				{unsuccessful ? (
					<TriangleAlert aria-hidden='true' className='text-error mt-0.5 size-4 shrink-0' />
				) : (
					<CheckCircle2 aria-hidden='true' className='text-success mt-0.5 size-4 shrink-0' />
				)}
				<div className='min-w-0 flex-1'>
					<div className='font-medium'>{summary}</div>
					{error ? <div className='text-base-content/75 mt-0.5'>{error.title}</div> : null}
					{failed.length ? (
						<ul className='mt-1 grid gap-0.5' aria-label='失败项目'>
							{failedItems.map(({ item, itemError, key }) => (
								<li key={key} className='flex min-w-0 gap-1.5'>
									<span className='min-w-0 truncate font-mono'>{item.path}</span>
									<span aria-hidden='true'>·</span>
									<span className='text-base-content/75 shrink-0'>{itemError.title}</span>
								</li>
							))}
							{failed.length > 5 ? <li>另有 {failed.length - 5} 个失败项目</li> : null}
						</ul>
					) : null}
				</div>
				{retry ? (
					<button
						type='button'
						className='btn btn-ghost btn-xs shrink-0'
						onClick={() => actions.requestOperation(retry)}
					>
						<RotateCcw aria-hidden='true' className='size-3.5' />
						重试
					</button>
				) : null}
				<button
					type='button'
					aria-label='关闭操作结果'
					title='关闭操作结果'
					className='hover:bg-base-200 grid size-6 shrink-0 place-items-center rounded-sm'
					onClick={actions.dismissOperationFeedback}
				>
					<X aria-hidden='true' className='size-3.5' />
				</button>
			</div>
		</section>
	);
}

function getFailedOperationItems(failed: Array<{ path: string; error: unknown }>) {
	const occurrences = new Map<string, number>();
	return failed.slice(0, 5).map((item) => {
		const itemError = formatFileManagerOperationError(item.error);
		const identity = `${item.path}\0${itemError.title}`;
		const occurrence = (occurrences.get(identity) ?? 0) + 1;
		occurrences.set(identity, occurrence);
		return { item, itemError, key: `${identity}\0${occurrence}` };
	});
}

function getFeedbackSummary(outcome: 'cancelled' | 'failed' | 'succeeded', completed: number, failed: number): string {
	if (outcome === 'cancelled') return completed ? `操作已取消，已完成 ${completed} 项` : '操作已取消';
	if (failed && completed) return `部分完成：成功 ${completed} 项，失败 ${failed} 项`;
	if (failed) return `${failed} 项操作失败`;
	if (outcome === 'failed') return '文件操作失败';
	return completed ? `已完成 ${completed} 项` : '操作已完成';
}
