import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import { Button } from '../lib/button/index.js';
import { Card, CardBody, CardTitle } from '../lib/card/index.js';
import { Input } from '../lib/input/index.js';
import { Switch } from '../lib/switch/index.js';

describe('@wener/ui built output', () => {
	it('renders published JavaScript with the automatic JSX runtime', () => {
		const html = renderToStaticMarkup(
			<Card variant='border'>
				<CardBody>
					<CardTitle>构建产物</CardTitle>
					<Input defaultValue='ready' controlSize='sm' />
					<Switch defaultChecked aria-label='enabled' />
					<Button>确认</Button>
				</CardBody>
			</Card>,
		);

		expect(html).toContain('构建产物');
		expect(html).toContain('input-sm');
		expect(html).toContain('toggle-primary');
		expect(html).toContain('btn-primary');
	});
});
