import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Alert, AlertDescription } from '../alert';
import { Badge } from '../badge';
import { Button } from '../button';
import { Card, CardBody, CardTitle } from '../card';
import { Input } from '../input';
import { Link } from './link';
import { Otp } from './otp';
import { Range } from './range';
import { Toggle } from './toggle';

function PrimitiveShowcase() {
	const [enabled, setEnabled] = useState(true);
	const [range, setRange] = useState('40');
	const [otp, setOtp] = useState('');

	return (
		<div className='grid w-full max-w-2xl gap-4'>
			<Card>
				<CardBody>
					<CardTitle>基础控件</CardTitle>
					<div className='flex flex-wrap gap-2'>
						<Button>主要操作</Button>
						<Button variant='outline'>次要操作</Button>
						<Badge tone='neutral' variant='soft'>
							Ready
						</Badge>
						<Link href='#docs'>查看文档</Link>
					</div>
					<Input aria-label='名称' placeholder='输入名称' />
					<div className='grid gap-2'>
						<Range aria-label='进度' value={range} onChange={(event) => setRange(event.currentTarget.value)} />
						<output>{range}%</output>
					</div>
					<label className='flex items-center gap-2'>
						<Toggle checked={enabled} onChange={(event) => setEnabled(event.currentTarget.checked)} />
						自动刷新
					</label>
					<Otp aria-label='验证码' value={otp} onValueChange={setOtp} />
				</CardBody>
			</Card>
			<Alert tone='info'>
				<div>
					<div className='font-medium'>通用 UI 包</div>
					<AlertDescription>这里只展示与产品、供应商和部署环境无关的基础组件。</AlertDescription>
				</div>
			</Alert>
		</div>
	);
}

const meta = {
	title: 'Primitive/Overview',
	component: PrimitiveShowcase,
	parameters: { layout: 'centered' },
} satisfies Meta<typeof PrimitiveShowcase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
