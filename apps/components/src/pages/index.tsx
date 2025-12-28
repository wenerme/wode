export default async function HomePage() {
	return (
		<div className='flex min-h-screen flex-col items-center justify-center p-24'>
			<h1 className='mb-4 text-4xl font-bold'>Wener Components Registry</h1>
			<p className='mb-8 text-lg text-gray-600'>A shadcn-compatible component registry</p>
			<div className='rounded-lg bg-gray-100 p-4 dark:bg-gray-800'>
				<code className='text-sm'>npx shadcn add https://ui-components.wener.me/r/hello-button</code>
			</div>
		</div>
	);
}

export const getConfig = async () => {
	return {
		render: 'static',
	} as const;
};
