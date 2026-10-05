import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Button } from '../lib/button/index.js';
import { Card, CardBody, CardTitle } from '../lib/card/index.js';
import { Components } from '../lib/index.js';
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

	it('renders migrated component families through the published root namespace', () => {
		const html = renderToStaticMarkup(
			<Components.AddressableFrame>
				<Components.AddressableFrameContent>
					<Components.HeaderContentFooterLayout header={<span>总计</span>}>
						<Components.CurrencyFormat value={42} currency='USD' locale='en-US' />
						<Components.LoadingIndicator label='正在加载数据' />
					</Components.HeaderContentFooterLayout>
				</Components.AddressableFrameContent>
			</Components.AddressableFrame>,
		);

		expect(html).toContain('data-slot="addressable-frame"');
		expect(html).toContain('$42.00');
		expect(html).toContain('正在加载数据');
	});
});
