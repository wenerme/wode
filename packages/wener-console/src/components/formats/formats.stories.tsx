import type { Meta } from '@storybook/react-vite';
import { AmountFormat } from './AmountFormat';
import { DateFormat } from './DateFormat';
import { DurationFormat } from './DurationFormat';
import { EmptyPlaceholder } from './EmptyPlaceholder';
import { ErrorPlaceholder } from './ErrorPlaceholder';
import { NotReadyPlaceholder } from './NotReadyPlaceholder';
import { PhoneNumberFormat } from './PhoneNumberFormat';
import { TruncateFormat } from './TruncateFormat';

const meta: Meta = {
	title: 'components/formats',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

export const Default = () => {
	const formatGroups = [
		{
			title: 'Placeholder Components',
			description: 'Components for handling empty states, errors, and loading states',
			items: [
				{
					title: 'EmptyPlaceholder',
					children: [
						{
							description: 'default',
							content: <EmptyPlaceholder />,
						},
					],
				},
				{
					title: 'ErrorPlaceholder',
					children: [
						{
							description: 'string error',
							content: <ErrorPlaceholder error='Sample error message' />,
						},
						{
							description: 'error object',
							content: <ErrorPlaceholder error={new Error('Sample error object')} />,
						},
					],
				},
				{
					title: 'NotReadyPlaceholder',
					children: [
						{
							description: 'default',
							content: <NotReadyPlaceholder />,
						},
						{
							description: 'loading',
							content: <NotReadyPlaceholder loading />,
						},
						{
							description: 'error',
							content: <NotReadyPlaceholder error={'error'} />,
						},
						{
							description: 'empty',
							content: <NotReadyPlaceholder empty={0} />,
						},
					],
				},
			],
		},
		{
			title: 'Data Format Components',
			description: 'Components for formatting numbers, dates, durations, and other data types',
			items: [
				{
					title: 'AmountFormat',
					children: [
						{
							description: 'integer',
							content: <AmountFormat value={1234} />,
						},
						{
							description: 'decimal',
							content: <AmountFormat value={1234.56} />,
						},
						{
							description: 'large number',
							content: <AmountFormat value={1234567.89} />,
						},
						{
							description: 'string number',
							content: <AmountFormat value='9876.54' />,
						},
						{
							description: 'undefined',
							content: <AmountFormat value={undefined} />,
						},
					],
				},
				{
					title: 'DateFormat',
					children: [
						{
							description: 'default (YYYY-MM-DD)',
							content: <DateFormat value={new Date('2024-03-15T14:30:00')} />,
						},
						{
							description: 'Chinese format',
							content: <DateFormat value={new Date('2024-03-15T14:30:00')} format='YYYY年MM月DD日 HH:mm' />,
						},
						{
							description: 'time only',
							content: <DateFormat value={new Date('2024-03-15T14:30:00')} format='HH:mm:ss' />,
						},
						{
							description: 'ISO string input',
							content: <DateFormat value='2024-03-15T14:30:00Z' />,
						},
						{
							description: 'current timestamp',
							content: <DateFormat value={Date.now()} format='YYYY-MM-DD HH:mm' />,
						},
						{
							description: 'invalid date',
							content: <DateFormat value='invalid' />,
						},
					],
				},
				{
					title: 'DurationFormat',
					children: [
						{
							description: '1.5 seconds',
							content: <DurationFormat value={1500} />,
						},
						{
							description: '30 seconds',
							content: <DurationFormat value={30000} />,
						},
						{
							description: '1.5 minutes',
							content: <DurationFormat value={90000} />,
						},
						{
							description: '1h 1m 1s',
							content: <DurationFormat value={3661000} />,
						},
						{
							description: 'undefined',
							content: <DurationFormat value={undefined} />,
						},
					],
				},
			],
		},
		{
			title: 'Text & Communication Format Components',
			description: 'Components for formatting text, phone numbers, and other communication data',
			items: [
				{
					title: 'TruncateFormat',
					children: [
						{
							description: 'short text',
							content: <TruncateFormat>abc</TruncateFormat>,
						},
						{
							description: 'long text',
							content: <TruncateFormat>abc def ghi jkl mno pqr stu vwx yz</TruncateFormat>,
						},
						{
							description: 'value prop',
							content: <TruncateFormat value={'abc def ghi jkl mno pqr stu vwx yz'} />,
						},
					],
				},
				{
					title: 'PhoneNumberFormat',
					children: [
						{
							description: 'Chinese mobile',
							content: <PhoneNumberFormat value='13812345678' />,
						},
						{
							description: 'Chinese landline',
							content: <PhoneNumberFormat value='02112345678' />,
						},
						{
							description: 'US number',
							content: <PhoneNumberFormat value='+1234567890' />,
						},
						{
							description: 'unmasked',
							content: <PhoneNumberFormat value='13812345678' unmask />,
						},
						{
							description: 'empty',
							content: <PhoneNumberFormat value='' />,
						},
					],
				},
			],
		},
	];

	return (
		<div className='flex flex-col gap-8 p-6'>
			{formatGroups.map((group, groupIndex) => (
				<div key={groupIndex} className='space-y-4'>
					<div className='border-base-300 border-b pb-2'>
						<h1 className='text-base-content text-2xl font-bold'>{group.title}</h1>
						<p className='text-base-content/70 text-sm'>{group.description}</p>
					</div>

					<div className='grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3'>
						{group.items.map((item, itemIndex) => (
							<div key={itemIndex} className='card bg-base-100 border-base-200 border shadow-sm'>
								<div className='card-body p-4'>
									<h2 className='card-title text-primary text-lg font-semibold'>{item.title}</h2>
									<div className='space-y-3'>
										{item.children.map((child, childIndex) => (
											<div key={childIndex} className='space-y-1'>
												<h3 className='text-base-content/80 text-sm font-medium'>{child.description}</h3>
												<div className='border-base-200 bg-base-50 min-h-[2rem] w-fit resize overflow-auto rounded border p-2 text-sm'>
													{child.content}
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			))}
		</div>
	);
};
