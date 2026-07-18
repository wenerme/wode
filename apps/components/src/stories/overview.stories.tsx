import type { Meta, StoryObj } from '@storybook/react-vite';
import registry from '../../registry.json';

function RegistryOverview() {
	return (
		<main className='mx-auto w-full max-w-6xl px-4 py-8 md:px-8'>
			<header className='border-base-300 flex flex-col gap-3 border-b pb-6 md:flex-row md:items-end md:justify-between'>
				<div>
					<div className='text-base-content/70 text-xs font-medium'>SHADCN REGISTRY</div>
					<h1 className='mt-1 text-2xl font-semibold'>Wener Components</h1>
					<p className='text-base-content/65 mt-1 max-w-2xl text-sm leading-6'>
						可安装源码与 Storybook 使用同一套 registry source。
					</p>
				</div>
				<a
					href='./r/registry.json'
					className='text-base-content text-sm font-medium underline-offset-4 hover:underline'
				>
					查看 registry.json
				</a>
			</header>

			<div className='border-base-300 bg-base-100 mt-6 border p-4'>
				<div className='text-base-content/65 text-xs'>安装示例</div>
				<code className='mt-2 block overflow-x-auto text-sm'>
					npx shadcn add https://ui-components.wener.me/r/console-shell.json
				</code>
			</div>

			<section className='mt-8'>
				<div className='mb-3 flex items-center justify-between'>
					<h2 className='text-sm font-semibold'>Registry items</h2>
					<span className='text-base-content/65 text-xs'>{registry.items.length} items</span>
				</div>
				<div className='divide-base-300 border-base-300 divide-y border-y'>
					{registry.items.map((item) => (
						<a
							key={item.name}
							href={`./r/${item.name}.json`}
							className='group hover:text-primary grid gap-1 py-4 md:grid-cols-[12rem_minmax(0,1fr)_7rem] md:items-center md:gap-4'
						>
							<span className='font-mono text-sm font-medium'>{item.name}</span>
							<span className='text-base-content/65 group-hover:text-primary text-sm'>{item.description}</span>
							<span className='text-base-content/65 text-xs md:text-right'>{item.type.replace('registry:', '')}</span>
						</a>
					))}
				</div>
			</section>
		</main>
	);
}

const meta = {
	title: 'Overview/Registry',
	component: RegistryOverview,
	tags: ['autodocs'],
	parameters: {
		docs: {
			description: {
				component: 'Human-readable catalog backed by the same registry.json that generates the shadcn endpoints.',
			},
		},
	},
} satisfies Meta<typeof RegistryOverview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Catalog: Story = {};
