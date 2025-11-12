import { type ComponentPropsWithRef, type FC, useEffect, useState } from 'react';
import { cn } from '@wener/console';
import { useEvent } from '@wener/reaction';

export const SearchInput: FC<
	{
		initialValue?: string;
		onValueChange?: (v: string) => void;
	} & Omit<ComponentPropsWithRef<'input'>, 'value'>
> = ({ initialValue = '', onValueChange, ...props }) => {
	const [value, setValue] = useState(() => initialValue || '');
	useEffect(() => {
		if (!value) {
			setValue(initialValue || '');
		}
	}, [initialValue]);
	return (
		<input
			type='search'
			placeholder='搜索'
			className={cn(
				'input input-sm input-bordered font-light transition-all',
				'data-[dirty]:input-info',
				'focus:w-72',
				value ? 'w-72' : 'w-24',
			)}
			value={value}
			data-dirty={value !== initialValue || null}
			onChange={useEvent((e) => setValue(e.target.value))}
			onKeyDown={useEvent((e) => {
				if (e.key === 'Enter') {
					onValueChange?.(value);
				}
			})}
			{...props}
		/>
	);
};
