import type { Meta, StoryObj } from '@storybook/react-vite';
import {
	BooleanFormat,
	BytesFormat,
	CurrencyFormat,
	DateFormat,
	DateTimeFormat,
	DecimalFormat,
	DurationFormat,
	EmptyPlaceholder,
	FormatProvider,
	PercentFormat,
	PhoneNumberFormat,
	RelativeTimeFormat,
	TimeFormat,
	TruncateFormat,
} from '../../registry/default/ui/formats';

const meta = {
	title: 'Utilities/Formats',
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const rows = [
	{
		label: 'Empty',
		value: <EmptyPlaceholder />,
		note: '—',
	},
	{
		label: 'Truncate',
		value: <TruncateFormat className='max-w-[10rem] md:max-w-64' value='INV-20260712-000000000000000000000000001' />,
		note: 'title fallback',
	},
	{
		label: 'Decimal',
		value: <DecimalFormat value='1234567.5' />,
		note: '2 fraction digits',
	},
	{
		label: 'Currency',
		value: <CurrencyFormat value='1234567.5' />,
		note: 'provider currency',
	},
	{
		label: 'Percent',
		value: <PercentFormat value={0.9876} />,
		note: 'ratio input',
	},
	{
		label: 'Percent value',
		value: <PercentFormat input='percent' value={98.76} />,
		note: 'percent input',
	},
	{
		label: 'Bytes',
		value: <BytesFormat value={1536 * 1024} />,
		note: 'SI label',
	},
	{
		label: 'Duration',
		value: <DurationFormat value={{ hours: 1, minutes: 2, seconds: 3 }} />,
		note: 'compact',
	},
	{
		label: 'Duration digital',
		value: <DurationFormat durationStyle='digital' value={{ hours: 1, minutes: 2, seconds: 3 }} />,
		note: 'timer',
	},
	{
		label: 'Date',
		value: <DateFormat value='2024-01-02T03:04:05.000Z' />,
		note: 'Asia/Shanghai',
	},
	{
		label: 'Time',
		value: <TimeFormat value='2024-01-02T03:04:05.000Z' />,
		note: 'short',
	},
	{
		label: 'Date time',
		value: <DateTimeFormat value='2024-01-02T03:04:05.000Z' />,
		note: 'medium',
	},
	{
		label: 'Relative',
		value: <RelativeTimeFormat live={false} now='2024-01-02T04:04:05.000Z' value='2024-01-02T03:04:05.000Z' />,
		note: 'fixed now',
	},
	{
		label: 'Boolean true',
		value: <BooleanFormat value={true} />,
		note: 'badge',
	},
	{
		label: 'Boolean false',
		value: <BooleanFormat value={false} />,
		note: 'badge',
	},
	{
		label: 'Phone masked',
		value: <PhoneNumberFormat value='13800138000' />,
		note: 'safe default',
	},
	{
		label: 'Phone visible',
		value: <PhoneNumberFormat mask={false} value='13800138000' />,
		note: 'opt-in',
	},
];

export const Catalog: Story = {
	render: () => (
		<FormatProvider value={{ currency: 'CNY', fallback: '—', locale: 'zh-CN', timeZone: 'Asia/Shanghai' }}>
			<main className='mx-auto min-h-screen w-full max-w-5xl px-4 py-8 md:px-8'>
				<header className='border-base-300 flex flex-wrap items-end justify-between gap-3 border-b pb-5'>
					<div>
						<div className='text-base-content/70 text-xs font-medium'>VALUE FORMATS</div>
						<h1 className='mt-1 text-xl font-semibold'>Common formats</h1>
					</div>
					<span className='text-base-content/70 text-sm'>{rows.length} examples</span>
				</header>
				<div className='border-base-300 mt-6 border-y'>
					<table className='w-full table-fixed border-collapse text-left text-sm'>
						<thead className='bg-base-200 text-base-content/70'>
							<tr>
								<th className='w-28 px-3 py-2 font-medium md:w-44'>Format</th>
								<th className='px-3 py-2 font-medium'>Value</th>
								<th className='hidden px-3 py-2 font-medium md:table-cell'>Note</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((row) => (
								<tr key={row.label} className='border-base-300 border-t'>
									<th className='break-words px-3 py-3 font-medium'>{row.label}</th>
									<td className='min-w-0 break-words px-3 py-3'>{row.value}</td>
									<td className='text-base-content/65 hidden px-3 py-3 md:table-cell'>{row.note}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</main>
		</FormatProvider>
	),
};
