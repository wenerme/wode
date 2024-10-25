import React from 'react';
import type { Meta } from '@storybook/react';
import { DaisyThemeDemo } from './DaisyThemeDemo';
import { ThemeListSelector } from './ThemeListSelector';

const meta: Meta = {
  title: 'daisy/theme',
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

function ThemeSelectorButton() {
  return null;
}

export const Demo = () => {
  return (
    <div>
      <h3>Theme Introduction</h3>
      <pre>
        {`
- 修改主题会记录在 localStorage.theme 
- 主题基于 daisyui
      `}
      </pre>
      <h3>ThemeSelectorButton</h3>
      <ThemeSelectorButton />
      <h3>ThemeListSelector</h3>
      <ThemeListSelector />
      <h3>DaisyDemo</h3>
      <DaisyThemeDemo />
    </div>
  );
};
