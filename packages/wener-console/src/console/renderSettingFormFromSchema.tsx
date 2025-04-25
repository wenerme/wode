import React, { type ReactNode } from 'react';
import { useFieldArray, type useForm } from 'react-hook-form';
import { PiArrowDownLight, PiArrowUpLight, PiMinusLight, PiPlus, PiPlusLight } from 'react-icons/pi';
import { JsonSchema, type JsonSchemaDef } from '@wener/common/jsonschema';
import { match, P } from 'ts-pattern';
import { cn } from '../utils/cn';

type FormContext = ReturnType<typeof useForm>;

type RenderSettingFormOptions = {
	schema: JsonSchemaDef;
	level?: number;
	path?: string[];
	forms: FormContext;
};

export function renderSettingFormFromSchema({ schema, level = 0, path = [], forms }: RenderSettingFormOptions) {
	const { register, control } = forms;
	return match(schema)
		.returnType<ReactNode>()
		.with({ type: 'string' }, (schema) => {
			let type = 'text';
			if (schema.sensitive) {
				type = 'password';
			}
			return <input type={type} className={'input input-sm input-bordered flex-1'} {...register(path.join('.'))} />;
		})
		.with({ anyOf: P.array() }, ({ anyOf }) => {
			return (
				<select {...register(path.join('.'))} className={'select select-bordered select-sm'}>
					<option value={''}>请选择</option>
					{anyOf.map((item: any, index) => {
						return (
							<option key={index} value={item.const}>
								{item.title}
							</option>
						);
					})}
				</select>
			);
		})
		.with({ type: 'array' }, (schema) => {
			const { title } = schema;
			const itemSchema = schema.items as JsonSchemaDef;
			const isPrimitive = JsonSchema.isPrimitiveType(itemSchema);
			const { append, remove, swap, fields } = useFieldArray({ name: path.join('.'), control });
			return (
				<section
					className={cn(
						'flex flex-col gap-2 p-2',
						isPrimitive && 'hover:border-info hover:bg-base-200 border border-transparent',
					)}
				>
					<header className={'flex items-center gap-2'}>
						{Boolean(title) && <h3 className={'text-lg font-medium'}>{String(title)}</h3>}
						<button
							className={'btn btn-square btn-ghost btn-secondary btn-sm'}
							onClick={() => {
								append(JsonSchema.create(itemSchema));
							}}
						>
							<PiPlus />
						</button>
					</header>
					{fields.map((field, index) => {
						const isLast = index === fields.length - 1;
						const isFirst = index === 0;
						let controller = (
							<div className={'flex items-center gap-2'}>
								{!isPrimitive && <h5 className={'px-2 font-medium opacity-75'}>#{index + 1}</h5>}
								<button
									type='button'
									className={'btn btn-square btn-secondary btn-sm'}
									onClick={() => {
										swap(index, index - 1);
									}}
									disabled={isFirst}
								>
									<PiArrowUpLight />
								</button>
								<button
									type='button'
									className={'btn btn-square btn-secondary btn-sm'}
									disabled={isLast}
									onClick={() => {
										swap(index, index + 1);
									}}
								>
									<PiArrowDownLight />
								</button>
								<button
									type='button'
									className={'btn btn-square btn-secondary btn-sm'}
									onClick={() => {
										append(JsonSchema.create(itemSchema));
									}}
								>
									<PiPlusLight />
								</button>
								<button
									type='button'
									className={'btn btn-square btn-secondary btn-sm'}
									onClick={() => {
										remove(index);
									}}
								>
									<PiMinusLight />
								</button>
							</div>
						);
						return (
							<div
								key={field.id}
								className={cn('flex gap-2', isPrimitive && 'items-center', !isPrimitive && 'flex-col')}
							>
								{!isPrimitive && controller}
								{renderSettingFormFromSchema({
									schema: itemSchema,
									level: level + 1,
									path: path.concat(index.toString()),
									forms,
								})}
								{isPrimitive && controller}
							</div>
						);
					})}
				</section>
			);
		})
		.with({ type: 'object' }, (schema) => {
			const { title } = schema;
			return (
				<section className={'flex flex-1 flex-col gap-1'}>
					{Boolean(title) && (
						<header>
							<h3 className={'text-lg font-medium'}>{String(title)}</h3>
						</header>
					)}
					{Object.entries(schema.properties as Record<string, JsonSchemaDef>).map(([key, prop]) => {
						if (['array', 'object'].includes(String(prop.type))) {
							return (
								<div className={'flex flex-col gap-2 p-2 pb-4'}>
									{renderSettingFormFromSchema({ schema: prop, level: level + 1, path: path.concat(key), forms })}
								</div>
							);
						}

						let content: ReactNode = null;
						if (prop.type === 'boolean') {
							content = (
								<div className='form-control'>
									<label className='label cursor-pointer'>
										<span className='label-text'>{prop.title}</span>
										<div className={'flex-1'}></div>
										<input
											type='checkbox'
											className={'checkbox-bordered checkbox checkbox-sm'}
											{...register(path.concat(key).join('.'))}
										/>
									</label>
								</div>
							);
						} else {
							content = (
								<>
									<div className={'label'}>
										<span className={'label-text font-medium'}>{prop.title}</span>
									</div>
									{renderSettingFormFromSchema({ schema: prop, level: level + 1, path: path.concat(key), forms })}
								</>
							);
						}

						return (
							<div
								key={key}
								className={cn('form-control', [
									'p-2',
									'hover:bg-base-200',
									'focus-within:border-info border border-transparent',
								])}
							>
								{content}
							</div>
						);
					})}
				</section>
			);
		})
		.otherwise((schema) => {
			return <div className={'text-error'}>不支持的 Schema: {JSON.stringify(schema)}</div>;
		});
}
