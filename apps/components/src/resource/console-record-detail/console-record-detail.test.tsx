import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import {
	ConsoleRecordActivityList,
	ConsoleRecordCommandBar,
	ConsoleRecordContentLayout,
	ConsoleRecordDetailPage,
	ConsoleRecordEditActions,
	ConsoleRecordFactList,
	ConsoleRecordHeader,
	ConsoleRecordRelatedList,
	ConsoleRecordSection,
	ConsoleRecordState,
} from './console-record-detail';
import { ConsoleRecordTabs } from './console-record-tabs';

describe('ConsoleRecordDetail', () => {
	it('renders a composable record page and preserves native props and zero values', () => {
		const markup = renderToStaticMarkup(
			<ConsoleRecordDetailPage
				id='record-page'
				commandBar={<ConsoleRecordCommandBar label='Contact actions'>Actions</ConsoleRecordCommandBar>}
				header={<ConsoleRecordHeader title={<span>Example Contact</span>} eyebrow='Contact' status='Active' />}
				footer='Updated now'
			>
				<ConsoleRecordContentLayout
					aside={<div>Owner context</div>}
					asideWidth='18rem'
					main={
						<ConsoleRecordSection title='Details'>
							<ConsoleRecordFactList facts={[{ id: 'open-orders', label: 'Open orders', value: 0 }]} />
						</ConsoleRecordSection>
					}
				/>
			</ConsoleRecordDetailPage>,
		);
		expect(markup).toContain('id="record-page"');
		expect(markup).toContain('aria-label="Contact actions"');
		expect(markup).toContain('--record-aside-width:18rem');
		expect(markup).toContain('Example Contact');
		expect(markup).toContain('>0</div></dd>');
		expect(markup).toContain('Owner context');
	});

	it('keeps semantic list roots for empty states', () => {
		const markup = renderToStaticMarkup(
			<>
				<ConsoleRecordFactList id='empty-facts' facts={[]} empty='No facts' emptyLabel='Information' />
				<ConsoleRecordActivityList id='empty-activity' activities={[]} empty='No activity' />
				<ConsoleRecordRelatedList id='empty-related' items={[]} empty='No related records' />
			</>,
		);
		expect(markup).toContain('<dl class="text-base-content/70');
		expect(markup).toContain('id="empty-facts"');
		expect(markup).toContain('<ol class="text-base-content/70');
		expect(markup).toContain('id="empty-activity"');
		expect(markup).toContain('<ul class="text-base-content/70');
		expect(markup).toContain('id="empty-related"');
	});

	it('renders accessible tabs and semantic activity and related lists', () => {
		const markup = renderToStaticMarkup(
			<>
				<ConsoleRecordTabs
					listLabel='Contact views'
					tabs={[
						{ value: 'overview', label: 'Overview', content: <p>Overview content</p> },
						{ value: 'activity', label: 'Activity', content: <p>Activity content</p> },
					]}
				/>
				<ConsoleRecordActivityList
					activities={[
						{ id: 'created', title: 'Record created', time: '09:30', dateTime: '2026-07-16T09:30:00+08:00' },
					]}
				/>
				<ConsoleRecordRelatedList items={[{ id: 'account', title: 'Example account', href: '/accounts/1' }]} />
			</>,
		);
		expect(markup).toContain('role="tablist"');
		expect(markup).toContain('aria-label="Contact views"');
		expect(markup).toContain('role="tab"');
		expect(markup).toContain('<ol');
		expect(markup).toContain('<time');
		expect(markup).toContain('dateTime="2026-07-16T09:30:00+08:00"');
		expect(markup).toContain('href="/accounts/1"');
		expect(markup).toContain('Activity content');
	});

	it('preserves explicit null selection, state classes, and zero badges', () => {
		const markup = renderToStaticMarkup(
			<ConsoleRecordTabs
				defaultValue={null}
				className={() => 'stateful-root'}
				tabs={[{ value: 'overview', label: 'Overview', badge: 0, content: <p>Overview content</p> }]}
			/>,
		);
		expect(markup).toContain('stateful-root');
		expect(markup).toContain('>0</span>');
		expect(markup).not.toContain('data-active');

		const controlledMarkup = renderToStaticMarkup(
			<ConsoleRecordTabs
				value={null}
				tabs={[{ value: 'overview', label: 'Overview', content: <p>Overview content</p> }]}
			/>,
		);
		expect(controlledMarkup).not.toContain('data-active');

		const emptyMarkup = renderToStaticMarkup(<ConsoleRecordTabs tabs={[]} />);
		expect(emptyMarkup).toContain('role="tablist"');
	});

	it('renders loading, empty, and error states with localized overrides', () => {
		const markup = renderToStaticMarkup(
			<>
				<ConsoleRecordState state='loading' />
				<ConsoleRecordState title='没有联系人' description='调整筛选条件后重试。' />
				<ConsoleRecordState state='error' title='加载失败' actions={<button type='button'>重试</button>} />
			</>,
		);
		expect(markup).toContain('role="status"');
		expect(markup).toContain('role="alert"');
		expect(markup).toContain('正在加载记录');
		expect(markup).toContain('没有联系人');
		expect(markup).toContain('加载失败');
		expect(markup).toContain('重试');
	});

	it('provides edit, cancel, save, and saving action states', () => {
		const noop = () => undefined;
		const markup = renderToStaticMarkup(
			<>
				<ConsoleRecordEditActions dirty={false} editing={false} onCancel={noop} onEdit={noop} onSave={noop} />
				<ConsoleRecordEditActions
					dirty
					editing
					onCancel={noop}
					onEdit={noop}
					onSave={noop}
					messages={{ cancel: 'Discard' }}
				/>
				<ConsoleRecordEditActions dirty editing onCancel={noop} onEdit={noop} onSave={noop} saving />
			</>,
		);
		expect(markup).toContain('编辑');
		expect(markup).toContain('Discard');
		expect(markup).toContain('保存');
		expect(markup).toContain('保存中');
	});
});
