import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert, AlertDescription, AlertTitle } from '@wener/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@wener/ui/avatar';
import { Badge } from '@wener/ui/badge';
import { Card, CardBody, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@wener/ui/card';
import type { DaisySize } from '@wener/ui/daisy';
import { Kbd } from '@wener/ui/kbd';
import { Loading } from '@wener/ui/loading';
import { Progress } from '@wener/ui/progress';
import { Separator } from '@wener/ui/separator';
import { Skeleton } from '@wener/ui/skeleton';
import { Status } from '@wener/ui/status';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@wener/ui/table';

const avatarSrc =
	'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"%3E%3Crect width="160" height="160" rx="80" fill="%23570df8"/%3E%3Ctext x="80" y="96" text-anchor="middle" font-family="sans-serif" font-size="54" font-weight="700" fill="white"%3ELC%3C/text%3E%3C/svg%3E';

type FeedbackArgs = {
	alertTone: 'default' | 'info' | 'success' | 'warning' | 'error';
	alertVariant: 'default' | 'outline' | 'dash' | 'soft';
	cardVariant: 'default' | 'border' | 'dash';
	cardSize: DaisySize;
	avatarStatus: 'default' | 'online' | 'offline';
	progressValue: number;
	loadingVariant: 'spinner' | 'dots' | 'ring' | 'ball' | 'bars' | 'infinity';
	tableZebra: boolean;
};

function UiFeedbackDisplayCatalog({
	alertTone,
	alertVariant,
	cardVariant,
	cardSize,
	avatarStatus,
	progressValue,
	loadingVariant,
	tableZebra,
}: FeedbackArgs) {
	return (
		<main className='bg-base-200 text-base-content min-h-screen p-4 md:p-8'>
			<div className='mx-auto grid w-full max-w-5xl gap-6'>
				<div className='grid gap-3 md:grid-cols-2'>
					<Alert tone={alertTone} variant={alertVariant}>
						<div>
							<AlertTitle>同步进行中</AlertTitle>
							<AlertDescription>后台正在处理 24 个资源。</AlertDescription>
						</div>
					</Alert>
					<Alert tone='success' variant='outline'>
						<div>
							<AlertTitle>配置已保存</AlertTitle>
							<AlertDescription>新配置将在下一次刷新时生效。</AlertDescription>
						</div>
					</Alert>
				</div>

				<Card variant={cardVariant} size={cardSize}>
					<CardBody>
						<CardHeader>
							<div className='flex items-center gap-3'>
								<Avatar status={avatarStatus}>
									<AvatarImage src={avatarSrc} alt='林澄' />
									<AvatarFallback>LC</AvatarFallback>
								</Avatar>
								<div>
									<CardTitle>运行状态</CardTitle>
									<CardDescription>最近一分钟的资源健康度</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className='grid gap-4'>
							<div className='flex flex-wrap gap-2'>
								<Badge tone='success'>正常</Badge>
								<Badge tone='warning' variant='soft'>
									2 个告警
								</Badge>
								<Badge variant='outline'>生产环境</Badge>
							</div>
							<Progress value={progressValue} max={100} tone='primary' />
							<div className='flex items-center gap-3'>
								<Loading variant={loadingVariant} size='sm' />
								<span className='flex items-center gap-2 text-sm'>
									<Status tone='success' size='sm' /> 连接正常
								</span>
								<span className='text-base-content/65 text-sm'>
									刷新 <Kbd size='sm'>R</Kbd>
								</span>
							</div>
							<Separator />
							<Table size='sm' zebra={tableZebra}>
								<TableHeader>
									<TableRow>
										<TableHead>资源</TableHead>
										<TableHead>状态</TableHead>
										<TableHead>延迟</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									<TableRow>
										<TableCell>API Gateway</TableCell>
										<TableCell>正常</TableCell>
										<TableCell>24ms</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>Worker</TableCell>
										<TableCell>告警</TableCell>
										<TableCell>183ms</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</CardContent>
						<CardFooter>
							<span className='text-base-content/65 text-xs'>更新时间：刚刚</span>
						</CardFooter>
					</CardBody>
				</Card>

				<div className='grid grid-cols-3 gap-3'>
					<Skeleton className='h-20' />
					<Skeleton className='h-20' />
					<Skeleton className='h-20' />
				</div>
			</div>
		</main>
	);
}

const meta = {
	id: 'components-ui-feedback-display',
	title: 'Core/Components/UI Feedback & Display',
	component: UiFeedbackDisplayCatalog,
	tags: ['autodocs'],
	parameters: { layout: 'fullscreen', controls: { expanded: true } },
	args: {
		alertTone: 'info',
		alertVariant: 'soft',
		cardVariant: 'border',
		cardSize: 'md',
		avatarStatus: 'online',
		progressValue: 72,
		loadingVariant: 'dots',
		tableZebra: true,
	},
	argTypes: {
		alertTone: {
			control: 'select',
			options: ['default', 'info', 'success', 'warning', 'error'],
			table: { category: 'Alert' },
		},
		alertVariant: {
			control: 'inline-radio',
			options: ['default', 'outline', 'dash', 'soft'],
			table: { category: 'Alert' },
		},
		cardVariant: {
			control: 'inline-radio',
			options: ['default', 'border', 'dash'],
			table: { category: 'Card' },
		},
		cardSize: {
			control: 'select',
			options: ['xs', 'sm', 'md', 'lg', 'xl'],
			table: { category: 'Card' },
		},
		avatarStatus: {
			control: 'inline-radio',
			options: ['default', 'online', 'offline'],
			table: { category: 'Display' },
		},
		progressValue: {
			control: { type: 'range', min: 0, max: 100, step: 1 },
			table: { category: 'Display' },
		},
		loadingVariant: {
			control: 'select',
			options: ['spinner', 'dots', 'ring', 'ball', 'bars', 'infinity'],
			table: { category: 'Display' },
		},
		tableZebra: { control: 'boolean', table: { category: 'Table' } },
	},
} satisfies Meta<typeof UiFeedbackDisplayCatalog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Catalog: Story = {};
