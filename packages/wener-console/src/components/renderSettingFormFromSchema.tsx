import { JsonSchema, type JsonSchemaDef } from '@wener/common/jsonschema';
import { cn } from '@wener/console';
import { isNotNil } from 'es-toolkit';
import type { ReactNode } from 'react';
import { useFieldArray, type useForm } from 'react-hook-form';
import { PiArrowDownLight, PiArrowUpLight, PiMinusLight, PiPlus, PiPlusLight } from 'react-icons/pi';
import { match, P } from 'ts-pattern';
import { type Renderable, resolveRenderable } from './Renderable';

type FormContext = ReturnType<typeof useForm>;

type RenderSettingFormOptions = {
	schema: JsonSchemaDef;
	level?: number;
	path?: string[];
	forms: FormContext;
	render?: Renderable<{
		schema: JsonSchemaDef;
		path: string[];
		name: string;
		forms: FormContext;
	}>;
};

type ExtendSchema = {
	sensitive?: boolean;
	'x-input'?: 'textarea' | 'password' | 'email' | 'url' | 'tel' | 'number';
} & JsonSchemaDef;

function getLabel(s: JsonSchemaDef) {
	return s.description || s.title;
}

export function renderSettingFormFromSchema({ schema, level = 0, path = [], forms, render }: RenderSettingFormOptions) {
	const { register, control } = forms;
	const name = path.join('.');
	if (render) {
		let out = resolveRenderable(
			render,
			{}, // do not register
			{
				name,
				path,
				schema,
				forms,
			},
		);
		if (isNotNil(out)) {
			return out;
		}
	}

	return match(schema)
		.returnType<ReactNode>()
		.with({ type: 'string' }, (schema) => {
			let type = 'text';
			if ((schema as ExtendSchema).sensitive) {
				type = 'password';
			}

			const xInput = schema['x-input'] as string | undefined;
			if (xInput === 'textarea') {
				return <textarea className={'textarea textarea-bordered textarea-sm flex-1'} rows={4} {...register(name)} />;
			}

			if (xInput && ['email', 'url', 'tel', 'password'].includes(xInput)) {
				type = xInput;
			}

			return <input type={type} className={'input input-sm input-bordered flex-1'} {...register(name)} />;
		})
		.with({ type: 'integer' }, (_schema) => {
			let type = 'text';
			return (
				<input
					type={type}
					className={'input input-sm input-bordered flex-1'}
					{...register(name, {
						valueAsNumber: true,
					})}
				/>
			);
		})
		.with({ anyOf: P.array() }, ({ anyOf }) => {
			return (
				<select {...register(name)} className={'select select-bordered select-sm'}>
					<option value={''}>请选择</option>
					{anyOf.map((item: any, index) => {
						return (
							<option key={index} value={item.const}>
								{getLabel(item)}
							</option>
						);
					})}
				</select>
			);
		})
		.with({ type: 'array' }, (schema) => {
			const label = getLabel(schema);
			const itemSchema = schema.items as JsonSchemaDef;
			const isPrimitive = JsonSchema.isPrimitiveType(itemSchema);
			const { append, remove, swap, fields } = useFieldArray({ name: name, control });
			return (
				<section
					className={cn(
						'flex flex-col gap-2 p-2',
						isPrimitive && 'hover:border-info hover:bg-base-200 border border-transparent',
					)}
				>
					<header className={'flex items-center gap-2'}>
						{label && <h3 className={'text-lg font-medium'}>{label}</h3>}
						<button
							type={'button'}
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
									render,
								})}
								{isPrimitive && controller}
							</div>
						);
					})}
				</section>
			);
		})
		.with({ type: 'object' }, (schema) => {
			const label = getLabel(schema);
			return (
				<section className={'flex flex-1 flex-col gap-1'}>
					{label && (
						<header>
							<h3 className={'text-lg font-medium'}>{label}</h3>
						</header>
					)}
					{Object.entries((schema.properties || {}) as Record<string, JsonSchemaDef>).map(([key, prop]) => {
						if (['array', 'object'].includes(prop.type as string)) {
							return (
								<div className={'flex flex-col gap-2 p-2 pb-4'}>
									{renderSettingFormFromSchema({
										schema: prop,
										level: level + 1,
										path: path.concat(key),
										forms,
										render,
									})}
								</div>
							);
						}

						let content: ReactNode = null;
						if (prop.type === 'boolean') {
							content = (
								<label className='label cursor-pointer'>
									<span>{getLabel(prop)}</span>
									<input type='checkbox' className={'checkbox checkbox-sm'} {...register(path.concat(key).join('.'))} />
								</label>
							);
						} else {
							content = (
								<>
									{/* only for complex */}
									{/*<legend className={'fieldset-legend'}>{getLabel(prop)}</legend>*/}
									<label className='label'>{getLabel(prop)}</label>
									{renderSettingFormFromSchema({
										schema: prop,
										level: level + 1,
										path: path.concat(key),
										forms,
										render,
									})}
								</>
							);
						}

						return (
							<fieldset
								key={key}
								className={cn('fieldset', [
									'p-2',
									'hover:bg-base-200',
									'focus-within:border-info border border-transparent',
									'[&>input]:w-full',
								])}
							>
								{content}
							</fieldset>
						);
					})}
				</section>
			);
		})
		.otherwise((schema) => {
			return <div className={'text-error'}>不支持的 Schema: {JSON.stringify(schema)}</div>;
		});
}
