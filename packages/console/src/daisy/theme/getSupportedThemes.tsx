export interface ThemeProps {
  label: string;
  value: string;
  schema?: 'dark' | 'light';
}

export function getSupportedThemes() {
  return themes;
}

// { label: 'Light', value: 'light', icon: <MdLightMode />, iconActive: <MdOutlineLightMode /> },
// { label: 'Dark', value: 'dark', type: 'dark', icon: <MdDarkMode />, iconActive: <MdOutlineDarkMode /> },
// { label: '跟随系统', value: 'system', icon: <MdSettings /> },

const themes = [
  { label: '亮色', value: 'light' },
  { label: '暗色', value: 'dark' },
  { label: '杯子蛋糕', value: 'cupcake' },
  { label: '大黄蜂', value: 'bumblebee' },
  { label: '绿宝石', value: 'emerald' },
  { label: '企业', value: 'corporate' },
  { label: '合成波', value: 'synthwave', schema: 'dark' },
  { label: '复古', value: 'retro' },
  { label: '赛伯朋克', value: 'cyberpunk' },
  { label: '情人节', value: 'valentine' },
  { label: '万圣节', value: 'halloween', schema: 'dark' },
  { label: '花园', value: 'garden' },
  { label: '森林', value: 'forest', schema: 'dark' },
  { label: '水色', value: 'aqua' },
  { label: '低保真', value: 'lofi' },
  { label: '粉彩', value: 'pastel' },
  { label: '幻想', value: 'fantasy' },
  { label: '线框', value: 'wireframe' },
  { label: '黑色', value: 'black', schema: 'dark' },
  { label: '奢华', value: 'luxury', schema: 'dark' },
  { label: '德古拉', value: 'dracula', schema: 'dark' },
  { label: 'CMYK', value: 'cmyk' },
  { label: '秋天', value: 'autumn' },
  { label: '商务', value: 'business', schema: 'dark' },
  { label: '酸性', value: 'acid' },
  { label: '柠檬汽水', value: 'lemonade' },
  { label: '夜晚', value: 'night', schema: 'dark' },
  { label: '咖啡', value: 'coffee', schema: 'dark' },
  { label: '冬天', value: 'winter' },
  { label: '暗淡', value: 'dim', schema: 'dark' },
  { label: '北欧', value: 'nord' },
  { label: '日落', value: 'sunset', schema: 'dark' },
] satisfies ThemeProps[];
