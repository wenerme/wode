import type { Skill } from '@wener/ai/agent/skill';
import type { AgentSkillPreviewProps } from './agent-skill-editor-types';

export function formatSkillMarkdown(value: Skill): string {
	const tags = value.tags?.length ? `\ntags: [${value.tags.map((tag) => JSON.stringify(tag)).join(', ')}]` : '';
	return `---\nname: ${JSON.stringify(value.name)}\ndescription: ${JSON.stringify(value.description)}\nversion: ${JSON.stringify(value.version)}${tags}\n---\n\n${value.instructions}`;
}

export function SkillMarkdownPreview({ markdown }: AgentSkillPreviewProps) {
	return (
		<div className='min-w-0'>
			<div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
				<div>
					<h4 className='text-sm font-semibold'>SKILL.md 预览</h4>
					<p className='text-base-content/60 text-xs'>仅展示 canonical 值；解析和文件写入由宿主 adapter 注入。</p>
				</div>
				<span className='badge badge-outline badge-sm'>只读预览</span>
			</div>
			<textarea
				readOnly
				aria-label='SKILL.md 只读预览'
				rows={Math.min(24, Math.max(6, markdown.split('\n').length))}
				spellCheck={false}
				value={markdown}
				className='bg-base-200 max-h-96 w-full min-w-0 resize-none overflow-auto rounded-sm border-0 p-3 font-mono text-xs leading-5 outline-none'
			/>
		</div>
	);
}
