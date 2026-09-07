import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from '@wener/ui/checkbox';
import type { DaisyColor, DaisySize } from '@wener/ui/daisy';
import { Field, FieldControl, FieldDescription, FieldError, FieldLabel } from '@wener/ui/field';
import { Fieldset, FieldsetLegend } from '@wener/ui/fieldset';
import { FileInput } from '@wener/ui/file-input';
import { Input } from '@wener/ui/input';
import { RadioGroup, RadioGroupItem } from '@wener/ui/radio-group';
import { Select } from '@wener/ui/select';
import { Slider } from '@wener/ui/slider';
import { Switch } from '@wener/ui/switch';
import { Textarea } from '@wener/ui/textarea';
import { useArgs, useEffect, useState } from 'storybook/preview-api';
import { expect, userEvent, waitFor, within } from 'storybook/test';

const plans = [
	{ label: '基础版', value: 'starter' },
	{ label: '专业版', value: 'pro' },
	{ label: '企业版', value: 'enterprise' },
] as const;
const syncManagerArgs = !('__vitest_worker__' in globalThis);

type ControlTone = 'default' | DaisyColor;
type Plan = (typeof plans)[number]['value'];
type Density = 'compact' | 'comfortable';

function isPlan(value: unknown): value is Plan {
	return plans.some((plan) => plan.value === value);
}

type UiFormsArgs = {
	tone: ControlTone;
	controlSize: DaisySize;
	textVariant: 'default' | 'ghost';
	emailState: 'valid' | 'invalid';
	disabled: boolean;
	plan: Plan;
	capacity: number;
	density: Density;
	notifications: boolean;
	syncEnabled: boolean;
};

function UiFormsCatalog({
	tone,
	controlSize,
	textVariant,
	emailState,
	disabled,
	plan,
	capacity,
	density,
	notifications,
	syncEnabled,
	onPlanChange,
	onCapacityChange,
	onDensityChange,
	onNotificationsChange,
	onSyncEnabledChange,
}: UiFormsArgs & {
	onPlanChange: (value: Plan) => void;
	onCapacityChange: (value: number) => void;
	onDensityChange: (value: Density) => void;
	onNotificationsChange: (checked: boolean) => void;
	onSyncEnabledChange: (checked: boolean) => void;
}) {
	const emailValue = emailState === 'valid' ? 'ops@example.com' : 'invalid-address';

	return (
		<main className='bg-base-200 text-base-content min-h-screen p-4 md:p-8'>
			<div className='border-base-300 bg-base-100 rounded-box mx-auto grid w-full max-w-3xl gap-6 border p-5'>
				<header>
					<h1 className='text-xl font-semibold'>表单组件</h1>
					<p className='text-base-content/65 mt-1 text-sm'>Native DaisyUI controls 与 Base UI state primitives。</p>
				</header>

				<div className='grid gap-5 md:grid-cols-2'>
					<Field key={emailState} name='email' invalid={emailState === 'invalid'}>
						<FieldLabel>邮箱</FieldLabel>
						<FieldControl
							render={
								<Input
									type='email'
									defaultValue={emailValue}
									variant={textVariant}
									tone={tone}
									controlSize={controlSize}
									disabled={disabled}
								/>
							}
							required
						/>
						<FieldDescription>用于接收通知。</FieldDescription>
						<FieldError>请输入有效邮箱。</FieldError>
					</Field>

					<Field name='plan'>
						<FieldLabel>套餐</FieldLabel>
						<Select.Root
							items={plans}
							value={plan}
							disabled={disabled}
							onValueChange={(value) => {
								if (isPlan(value)) onPlanChange(value);
							}}
						>
							<Select.Trigger variant={textVariant} tone={tone} size={controlSize}>
								<Select.Value />
							</Select.Trigger>
							<Select.Content>
								<Select.List>
									<Select.Group>
										{plans.map((plan) => (
											<Select.Item key={plan.value} value={plan.value}>
												<Select.ItemText>{plan.label}</Select.ItemText>
											</Select.Item>
										))}
									</Select.Group>
								</Select.List>
							</Select.Content>
						</Select.Root>
					</Field>

					<Field name='description' className='md:col-span-2'>
						<FieldLabel>说明</FieldLabel>
						<FieldControl
							render={
								<Textarea
									defaultValue='这是一段可编辑说明。'
									variant={textVariant}
									tone={tone}
									size={controlSize}
									disabled={disabled}
								/>
							}
						/>
					</Field>

					<Field name='attachment' disabled={disabled}>
						<FieldLabel>附件</FieldLabel>
						<FieldControl
							render={<FileInput accept='image/*,.pdf' variant={textVariant} tone={tone} controlSize={controlSize} />}
						/>
					</Field>

					<Field name='capacity' disabled={disabled}>
						<FieldLabel>容量</FieldLabel>
						<FieldControl
							render={
								<Slider
									min={0}
									max={100}
									value={capacity}
									tone={tone}
									size={controlSize}
									onChange={(event) => onCapacityChange(event.currentTarget.valueAsNumber)}
								/>
							}
						/>
					</Field>
				</div>

				<Fieldset>
					<FieldsetLegend>偏好</FieldsetLegend>
					<div className='grid gap-3 sm:grid-cols-2'>
						<label className='label cursor-pointer justify-start gap-3'>
							<Checkbox
								checked={notifications}
								tone={tone}
								size={controlSize}
								disabled={disabled}
								onCheckedChange={onNotificationsChange}
							/>
							<span>接收产品通知</span>
						</label>
						<label className='label cursor-pointer justify-start gap-3'>
							<Switch
								checked={syncEnabled}
								tone={tone}
								size={controlSize}
								disabled={disabled}
								onCheckedChange={onSyncEnabledChange}
							/>
							<span>启用自动同步</span>
						</label>
					</div>
					<RadioGroup
						name='density'
						value={density}
						disabled={disabled}
						className='mt-3 grid-cols-2'
						onValueChange={(value) => onDensityChange(value as Density)}
					>
						<label className='label cursor-pointer justify-start gap-3'>
							<RadioGroupItem value='compact' tone={tone} size={controlSize} />
							<span>紧凑</span>
						</label>
						<label className='label cursor-pointer justify-start gap-3'>
							<RadioGroupItem value='comfortable' tone={tone} size={controlSize} />
							<span>舒适</span>
						</label>
					</RadioGroup>
				</Fieldset>
			</div>
		</main>
	);
}

function UiFormsInteractions() {
	return (
		<div className='bg-base-100 grid max-w-xl gap-5 p-5'>
			<label className='label cursor-pointer justify-start gap-3'>
				<Switch defaultChecked />
				<span>启用自动同步</span>
			</label>
			<label className='label cursor-pointer justify-start gap-3'>
				<Checkbox defaultChecked />
				<span>订阅运行告警</span>
			</label>
			<RadioGroup defaultValue='weekly' aria-label='摘要频率' className='grid-cols-3'>
				<label className='label cursor-pointer justify-start gap-3'>
					<RadioGroupItem value='realtime' />
					<span>实时</span>
				</label>
				<label className='label cursor-pointer justify-start gap-3'>
					<RadioGroupItem value='daily' />
					<span>每日</span>
				</label>
				<label className='label cursor-pointer justify-start gap-3'>
					<RadioGroupItem value='weekly' />
					<span>每周</span>
				</label>
			</RadioGroup>
		</div>
	);
}

const meta = {
	id: 'components-ui-forms',
	title: 'Core/Components/UI Forms',
	tags: ['autodocs'],
	parameters: { layout: 'fullscreen', controls: { expanded: true } },
	args: {
		tone: 'primary',
		controlSize: 'md',
		textVariant: 'default',
		emailState: 'invalid',
		disabled: false,
		plan: 'pro',
		capacity: 60,
		density: 'compact',
		notifications: true,
		syncEnabled: true,
	},
	argTypes: {
		tone: {
			control: 'select',
			options: ['default', 'neutral', 'primary', 'secondary', 'accent', 'info', 'success', 'warning', 'error'],
			table: { category: 'Appearance' },
		},
		controlSize: {
			control: 'select',
			options: ['xs', 'sm', 'md', 'lg', 'xl'],
			table: { category: 'Appearance' },
		},
		textVariant: {
			control: 'inline-radio',
			options: ['default', 'ghost'],
			table: { category: 'Appearance' },
		},
		emailState: {
			control: 'inline-radio',
			options: ['valid', 'invalid'],
			table: { category: 'State' },
		},
		disabled: { control: 'boolean', table: { category: 'State' } },
		plan: {
			control: 'inline-radio',
			options: ['starter', 'pro', 'enterprise'],
			table: { category: 'Value' },
		},
		capacity: {
			control: { type: 'range', min: 0, max: 100, step: 1 },
			table: { category: 'Value' },
		},
		density: {
			control: 'inline-radio',
			options: ['compact', 'comfortable'],
			table: { category: 'Value' },
		},
		notifications: { control: 'boolean', table: { category: 'Value' } },
		syncEnabled: { control: 'boolean', table: { category: 'Value' } },
	},
} satisfies Meta<UiFormsArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Catalog: Story = {
	render: function Render() {
		const [args, updateArgs] = useArgs<UiFormsArgs>();
		const [plan, setPlan] = useState(args.plan);
		const [capacity, setCapacity] = useState(args.capacity);
		const [density, setDensity] = useState(args.density);
		const [notifications, setNotifications] = useState(args.notifications);
		const [syncEnabled, setSyncEnabled] = useState(args.syncEnabled);

		useEffect(() => setPlan(args.plan), [args.plan]);
		useEffect(() => setCapacity(args.capacity), [args.capacity]);
		useEffect(() => setDensity(args.density), [args.density]);
		useEffect(() => setNotifications(args.notifications), [args.notifications]);
		useEffect(() => setSyncEnabled(args.syncEnabled), [args.syncEnabled]);

		return (
			<UiFormsCatalog
				{...args}
				plan={plan}
				capacity={capacity}
				density={density}
				notifications={notifications}
				syncEnabled={syncEnabled}
				onPlanChange={(value) => {
					setPlan(value);
					if (syncManagerArgs) updateArgs({ plan: value });
				}}
				onCapacityChange={(value) => {
					setCapacity(value);
					if (syncManagerArgs) updateArgs({ capacity: value });
				}}
				onDensityChange={(value) => {
					setDensity(value);
					if (syncManagerArgs) updateArgs({ density: value });
				}}
				onNotificationsChange={(checked) => {
					setNotifications(checked);
					if (syncManagerArgs) updateArgs({ notifications: checked });
				}}
				onSyncEnabledChange={(checked) => {
					setSyncEnabled(checked);
					if (syncManagerArgs) updateArgs({ syncEnabled: checked });
				}}
			/>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByRole('checkbox', { name: '接收产品通知' })).toBeVisible();
		await expect(canvas.getByLabelText('附件')).toHaveAttribute('type', 'file');
		await expect(canvas.getByLabelText('容量')).toHaveAttribute('type', 'range');

		const email = canvas.getByLabelText('邮箱');
		const plan = canvas.getByRole('combobox', { name: '套餐' });
		const attachment = canvas.getByLabelText('附件');
		const capacity = canvas.getByLabelText('容量');
		if (Math.abs(email.getBoundingClientRect().left - plan.getBoundingClientRect().left) > 1) {
			expect(Math.abs(email.getBoundingClientRect().top - plan.getBoundingClientRect().top)).toBeLessThan(1);
			expect(Math.abs(attachment.getBoundingClientRect().top - capacity.getBoundingClientRect().top)).toBeLessThan(1);
		}
	},
};

export const Interactions: Story = {
	render: () => <UiFormsInteractions />,
	parameters: { controls: { disable: true } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const syncSwitch = canvas.getByRole('switch', { name: '启用自动同步' });
		await userEvent.click(syncSwitch);
		await waitFor(() => expect(syncSwitch).toHaveAttribute('aria-checked', 'false'));

		const alertCheckbox = canvas.getByRole('checkbox', { name: '订阅运行告警' });
		await userEvent.click(alertCheckbox);
		await waitFor(() => expect(alertCheckbox).toHaveAttribute('aria-checked', 'false'));

		const realtimeRadio = canvas.getByRole('radio', { name: '实时' });
		await userEvent.click(realtimeRadio);
		await waitFor(() => expect(realtimeRadio).toHaveAttribute('aria-checked', 'true'));
	},
};
