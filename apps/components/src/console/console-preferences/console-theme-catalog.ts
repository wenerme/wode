export type ConsoleThemeColorScheme = 'light' | 'dark';

export type ConsoleThemeOption = {
	value: string;
	label: string;
	colorScheme: ConsoleThemeColorScheme;
	description?: string;
};

export const defaultConsoleThemeOptions = [
	{ value: 'wener', label: 'Wener', colorScheme: 'light', description: '清晰的青蓝工作界面' },
	{ value: 'light', label: '亮色', colorScheme: 'light' },
	{ value: 'dark', label: '暗色', colorScheme: 'dark' },
	{ value: 'cupcake', label: '杯子蛋糕', colorScheme: 'light' },
	{ value: 'bumblebee', label: '大黄蜂', colorScheme: 'light' },
	{ value: 'emerald', label: '绿宝石', colorScheme: 'light' },
	{ value: 'corporate', label: '企业', colorScheme: 'light' },
	{ value: 'synthwave', label: '合成波', colorScheme: 'dark' },
	{ value: 'retro', label: '复古', colorScheme: 'light' },
	{ value: 'cyberpunk', label: '赛博朋克', colorScheme: 'light' },
	{ value: 'valentine', label: '情人节', colorScheme: 'light' },
	{ value: 'halloween', label: '万圣节', colorScheme: 'dark' },
	{ value: 'garden', label: '花园', colorScheme: 'light' },
	{ value: 'forest', label: '森林', colorScheme: 'dark' },
	{ value: 'aqua', label: '水色', colorScheme: 'dark' },
	{ value: 'lofi', label: '低保真', colorScheme: 'light' },
	{ value: 'pastel', label: '粉彩', colorScheme: 'light' },
	{ value: 'fantasy', label: '幻想', colorScheme: 'light' },
	{ value: 'wireframe', label: '线框', colorScheme: 'light' },
	{ value: 'black', label: '黑色', colorScheme: 'dark' },
	{ value: 'luxury', label: '奢华', colorScheme: 'dark' },
	{ value: 'dracula', label: '德古拉', colorScheme: 'dark' },
	{ value: 'cmyk', label: 'CMYK', colorScheme: 'light' },
	{ value: 'autumn', label: '秋天', colorScheme: 'light' },
	{ value: 'business', label: '商务', colorScheme: 'dark' },
	{ value: 'acid', label: '酸性', colorScheme: 'light' },
	{ value: 'lemonade', label: '柠檬汽水', colorScheme: 'light' },
	{ value: 'night', label: '夜晚', colorScheme: 'dark' },
	{ value: 'coffee', label: '咖啡', colorScheme: 'dark' },
	{ value: 'winter', label: '冬天', colorScheme: 'light' },
	{ value: 'dim', label: '暗淡', colorScheme: 'dark' },
	{ value: 'nord', label: '北欧', colorScheme: 'light' },
	{ value: 'sunset', label: '日落', colorScheme: 'dark' },
	{ value: 'caramellatte', label: '焦糖拿铁', colorScheme: 'light' },
	{ value: 'abyss', label: '深渊', colorScheme: 'dark' },
	{ value: 'silk', label: '丝绸', colorScheme: 'light' },
] as const satisfies readonly ConsoleThemeOption[];

export function getConsoleThemesByColorScheme(
	themeOptions: readonly ConsoleThemeOption[],
	colorScheme: ConsoleThemeColorScheme,
) {
	return themeOptions.filter((theme) => theme.colorScheme === colorScheme);
}

export function filterConsoleThemeOptions(themeOptions: readonly ConsoleThemeOption[], query: string) {
	const normalizedQuery = query.trim().toLocaleLowerCase();
	if (!normalizedQuery) return [...themeOptions];
	return themeOptions.filter((theme) =>
		[theme.label, theme.value, theme.description]
			.filter((value): value is string => Boolean(value))
			.some((value) => value.toLocaleLowerCase().includes(normalizedQuery)),
	);
}

export function assertConsoleThemeOptions(themeOptions: readonly ConsoleThemeOption[]) {
	const values = new Set<string>();
	for (const theme of themeOptions) {
		if (values.has(theme.value)) {
			throw new Error(`Console theme options must use unique values; found duplicate "${theme.value}".`);
		}
		values.add(theme.value);
	}
	if (!themeOptions.some((theme) => theme.colorScheme === 'light')) {
		throw new Error('Console theme options must include at least one light theme.');
	}
	if (!themeOptions.some((theme) => theme.colorScheme === 'dark')) {
		throw new Error('Console theme options must include at least one dark theme.');
	}
}
