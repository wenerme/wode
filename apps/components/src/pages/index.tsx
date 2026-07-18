import registry from '../../registry.json';

export default async function HomePage() {
	return (
		<div className='bg-base-200 text-base-content min-h-screen'>
			<header className='border-base-300 bg-base-100 border-b'>
				<div className='mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-3 md:px-8'>
					<div className='min-w-0 flex-1'>
						<div className='text-base-content/70 text-xs font-medium'>SHADCN REGISTRY</div>
						<h1 className='truncate text-lg font-semibold'>Wener Components</h1>
					</div>
					<a
						href='/r/registry.json'
						className='text-base-content text-sm font-medium underline-offset-4 hover:underline'
					>
						registry.json
					</a>
					<a href='https://github.com/wenerme/wode' className='text-base-content/65 hover:text-primary text-sm'>
						Source
					</a>
				</div>
			</header>

			<main className='mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8'>
				<section className='border-base-300 bg-base-100 border p-4'>
					<div className='text-base-content/65 text-xs'>Install a block</div>
					<code className='mt-2 block overflow-x-auto text-sm'>
						npx shadcn add https://ui-components.wener.me/r/console-shell.json
					</code>
				</section>

				<section className='mt-7'>
					<div className='mb-3 flex items-center justify-between gap-3'>
						<div>
							<h2 className='text-sm font-semibold'>Components and blocks</h2>
							<p className='text-base-content/65 mt-0.5 text-xs'>
								Installable source files generated from the registry catalog.
							</p>
						</div>
						<span className='text-base-content/65 text-xs'>{registry.items.length} items</span>
					</div>
					<div className='divide-base-300 border-base-300 divide-y border-y'>
						{registry.items.map((item) => (
							<a
								key={item.name}
								href={`/r/${item.name}.json`}
								className='group hover:text-primary focus-visible:ring-primary grid gap-1 py-4 outline-none focus-visible:ring-2 md:grid-cols-[13rem_minmax(0,1fr)_7rem] md:items-center md:gap-4'
							>
								<span className='font-mono text-sm font-medium'>{item.name}</span>
								<span className='text-base-content/65 group-hover:text-primary text-sm leading-5'>
									{item.description}
								</span>
								<span className='text-base-content/65 text-xs md:text-right'>{item.type.replace('registry:', '')}</span>
							</a>
						))}
					</div>
				</section>
			</main>
		</div>
	);
}

export const getConfig = async () => {
	return {
		render: 'static',
	} as const;
};
