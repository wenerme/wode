import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
	HookForm,
	HookFormDataPreviewButton,
	HookFormDebugButton,
	HookFormErrorSummary,
	HookFormField,
	HookFormSubmitButton,
} from '../../registry/default/ui/hook-form';

type ProfileFormData = {
	age?: number;
	bio?: string;
	email: string;
	name: string;
	newsletter: boolean;
};

const meta = {
	title: 'Utilities/Hook Form',
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const ProfileForm: Story = {
	render: () => <ProfileFormDemo />,
};

function ProfileFormDemo() {
	const [submitted, setSubmitted] = useState<ProfileFormData | undefined>();
	return (
		<main className='bg-base-200 min-h-screen px-4 py-8 md:px-8'>
			<section className='bg-base-100 border-base-300 mx-auto max-w-3xl border p-5 shadow-sm md:p-6'>
				<header className='border-base-300 mb-5 flex flex-wrap items-end justify-between gap-3 border-b pb-4'>
					<div>
						<div className='text-base-content/70 text-xs font-medium'>REACT HOOK FORM</div>
						<h1 className='mt-1 text-xl font-semibold'>Profile form</h1>
					</div>
					{submitted && <span className='badge badge-success'>Saved</span>}
				</header>
				<HookForm<ProfileFormData>
					defaultValues={{
						age: 28,
						bio: 'Console operator',
						email: 'wener@example.com',
						name: 'Wener',
						newsletter: true,
					}}
					onSubmit={async (data) => {
						await new Promise((resolve) => window.setTimeout(resolve, 180));
						setSubmitted(data);
					}}
					formProps={{ className: 'space-y-4' }}
				>
					<HookFormErrorSummary />
					<div className='grid gap-4 md:grid-cols-2'>
						<HookFormField<ProfileFormData> name='name' label='Name' required='Name is required' />
						<HookFormField<ProfileFormData>
							name='email'
							label='Email'
							type='email'
							required='Email is required'
							rules={{ pattern: { message: 'Use a valid email address', value: /^\S+@\S+\.\S+$/ } }}
						/>
						<HookFormField<ProfileFormData>
							name='age'
							label='Age'
							type='number'
							inputProps={{ min: 0 }}
							parse={(value) => (value === '' ? undefined : Number(value))}
						/>
						<HookFormField<ProfileFormData> name='newsletter' label='Newsletter' type='checkbox' />
					</div>
					<HookFormField<ProfileFormData> name='bio' label='Bio' controlType='textarea' textareaProps={{ rows: 4 }} />
					<div className='flex flex-wrap items-center justify-between gap-2 pt-2'>
						<div className='join'>
							<HookFormSubmitButton className='join-item' dirtyOnly loadingText='Saving'>
								Save
							</HookFormSubmitButton>
							<HookFormDataPreviewButton<ProfileFormData> className='join-item btn-neutral' />
							<HookFormDebugButton className='join-item' />
						</div>
						{submitted && <code className='bg-base-200 max-w-full truncate px-2 py-1 text-xs'>{submitted.email}</code>}
					</div>
				</HookForm>
			</section>
		</main>
	);
}
