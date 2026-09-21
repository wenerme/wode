import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../src/accordion';
import { Alert, AlertDescription, AlertTitle } from '../src/alert';
import { Badge } from '../src/badge';
import {
	Breadcrumb,
	BreadcrumbChevronSeparator,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '../src/breadcrumb';
import { Button } from '../src/button';
import { Card, CardBody, CardTitle } from '../src/card';
import { Checkbox } from '../src/checkbox';
import { daisyColors, daisySizes } from '../src/daisy';
import { Field, FieldLabel } from '../src/field';
import { Input } from '../src/input';
import { Loading } from '../src/loading';
import { Pagination, PaginationButton, PaginationLink } from '../src/pagination';
import { RadioGroup, RadioGroupItem } from '../src/radio-group';
import { Select } from '../src/select';
import { Slider } from '../src/slider';
import { Status } from '../src/status';
import { Switch } from '../src/switch';
import { Table, TableBody, TableCell, TableRow } from '../src/table';
import { Tabs } from '../src/tabs';
import { Toast, ToastContent, ToastRoot, toastVariants } from '../src/toast';

describe('@wener/ui Daisy primitives', () => {
	it('exports a bounded shared Daisy vocabulary', () => {
		expect(daisyColors).toEqual(['neutral', 'primary', 'secondary', 'accent', 'info', 'success', 'warning', 'error']);
		expect(daisySizes).toEqual(['xs', 'sm', 'md', 'lg', 'xl']);
	});

	it('renders native and display variants as static Daisy classes', () => {
		const html = renderToStaticMarkup(
			<div>
				<Button variant='outline' size='sm'>
					保存
				</Button>
				<Input tone='error' controlSize='lg' size={24} />
				<Slider tone='accent' size='sm' min={0} max={10} />
				<Badge tone='success' variant='soft'>
					正常
				</Badge>
				<Loading variant='dots' size='xs' />
				<Status tone='warning' size='lg' />
			</div>,
		);

		expect(html).toContain('btn-outline');
		expect(html).toContain('btn-sm');
		expect(html).toContain('input-error');
		expect(html).toContain('input-lg');
		expect(html).toContain('size="24"');
		expect(html).toContain('range-accent');
		expect(html).toContain('badge-soft');
		expect(html).toContain('loading-dots');
		expect(html).toContain('status-warning');
	});

	it('keeps shadcn-style display composition', () => {
		const html = renderToStaticMarkup(
			<>
				<Alert tone='info'>
					<div>
						<AlertTitle>标题</AlertTitle>
						<AlertDescription>说明</AlertDescription>
					</div>
				</Alert>
				<Card variant='border'>
					<CardBody>
						<CardTitle>卡片</CardTitle>
					</CardBody>
				</Card>
				<Table zebra>
					<TableBody>
						<TableRow>
							<TableCell>值</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</>,
		);

		expect(html).toContain('alert-info');
		expect(html).toContain('card-border');
		expect(html).toContain('card-body');
		expect(html).toContain('table-zebra');
		expect(html).toContain('data-slot="table-container"');
	});

	it('渲染导航默认标签并允许调用方覆盖', () => {
		const html = renderToStaticMarkup(
			<>
				<Breadcrumb>
					<BreadcrumbPage>当前页面</BreadcrumbPage>
				</Breadcrumb>
				<Breadcrumb aria-label='自定义面包屑导航' />
				<Pagination />
				<Pagination aria-label='自定义分页导航' />
			</>,
		);

		expect(html).toContain('aria-label="面包屑导航"');
		expect(html).toContain('aria-label="自定义面包屑导航"');
		expect(html).toContain('aria-label="分页导航"');
		expect(html).toContain('aria-label="自定义分页导航"');
		expect(html).toContain('<span data-slot="breadcrumb-page" aria-current="page"');
	});

	it('保留分页链接与按钮的当前页语义', () => {
		const inactiveLink = renderToStaticMarkup(<PaginationLink href='/page/1'>第一页</PaginationLink>);
		const activeLink = renderToStaticMarkup(
			<PaginationLink href='/page/2' active>
				第二页
			</PaginationLink>,
		);
		const inactiveButton = renderToStaticMarkup(<PaginationButton>第三页</PaginationButton>);
		const activeButton = renderToStaticMarkup(<PaginationButton active>第四页</PaginationButton>);

		expect(inactiveLink).not.toContain('aria-current');
		expect(activeLink).toContain('aria-current="page"');
		expect(inactiveButton).not.toContain('aria-current');
		expect(activeButton).toContain('aria-current="page"');
	});

	it('将面包屑分隔符从辅助技术中隐藏', () => {
		const html = renderToStaticMarkup(
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink href='/'>首页</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>当前页</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>,
		);

		expect(html).toContain('<li data-slot="breadcrumb-separator" role="presentation" aria-hidden="true"');
		expect(html).toContain('aria-hidden="true"');
		expect(html).not.toContain('<ol data-slot="breadcrumb-list" class="flex items-center"><span');
	});

	it('仅在显式面包屑分隔符存在时抑制 DaisyUI 自动分隔', () => {
		const automatic = renderToStaticMarkup(
			<BreadcrumbList>
				<BreadcrumbItem>首页</BreadcrumbItem>
				<BreadcrumbItem>当前页</BreadcrumbItem>
			</BreadcrumbList>,
		);
		const explicit = renderToStaticMarkup(
			<BreadcrumbList>
				<BreadcrumbItem>首页</BreadcrumbItem>
				<BreadcrumbSeparator />
				<BreadcrumbItem>当前页</BreadcrumbItem>
			</BreadcrumbList>,
		);

		expect(automatic).not.toContain('before:hidden!');
		expect(explicit).toContain('before:hidden!');
		expect(explicit).toContain('[&amp;+[data-slot=breadcrumb-item]]:before:hidden!');

		const rtlChevron = renderToStaticMarkup(<BreadcrumbChevronSeparator />);
		expect(rtlChevron).toContain('rtl:rotate-180');
		expect(rtlChevron).toContain('viewBox="0 0 16 16"');
	});

	it('keeps field tracks top-aligned and toast content in one full-width column', () => {
		const field = renderToStaticMarkup(
			<Field>
				<FieldLabel>名称</FieldLabel>
				<Input />
			</Field>,
		);
		const toast = renderToStaticMarkup(
			<Toast.Provider>
				<ToastRoot toast={{ id: 'warning', title: '警告', type: 'warning' }}>
					<ToastContent>
						<div>内容</div>
						<Toast.Close>关闭</Toast.Close>
					</ToastContent>
				</ToastRoot>
			</Toast.Provider>,
		);

		expect(field).toContain('grid content-start gap-1.5');
		expect(toastVariants({ tone: 'warning' })).toContain('alert-warning');
		expect(toast).toContain('grid-cols-1!');
		expect(toast).toContain('flex w-full min-w-0 items-start gap-3');
		expect(toast).toContain('data-slot="toast-close"');
	});

	it('renders Base UI state primitives with Daisy component classes', () => {
		const html = renderToStaticMarkup(
			<>
				<Checkbox defaultChecked aria-label='选择' />
				<Switch defaultChecked aria-label='同步' />
				<RadioGroup defaultValue='a' name='choice'>
					<RadioGroupItem value='a' aria-label='A' />
				</RadioGroup>
				<Tabs.Root defaultValue='a'>
					<Tabs.List>
						<Tabs.Trigger value='a'>A</Tabs.Trigger>
					</Tabs.List>
					<Tabs.Content value='a'>内容</Tabs.Content>
				</Tabs.Root>
				<Accordion defaultValue={['a']}>
					<AccordionItem value='a'>
						<AccordionTrigger>A</AccordionTrigger>
						<AccordionContent>内容</AccordionContent>
					</AccordionItem>
				</Accordion>
			</>,
		);

		expect(html).toContain('class="checkbox checkbox-primary checkbox-md size-6"');
		expect(html).toContain('class="toggle toggle-primary toggle-md h-6 w-10"');
		expect(html).toContain('class="radio radio-primary radio-md size-6"');
		expect(html).toContain('class="tabs');
		expect(html).not.toContain('class="tab-content');
		expect(html).toContain('class="collapse');
	});

	it('renders the Base UI select trigger without a portal dependency', () => {
		const items = [{ label: 'A', value: 'a' }];
		const html = renderToStaticMarkup(
			<Select.Root items={items} defaultValue='a'>
				<Select.Trigger>
					<Select.Value />
				</Select.Trigger>
			</Select.Root>,
		);

		expect(html).toContain('data-slot="select-trigger"');
		expect(html).toContain('class="select w-full');
	});
});
