import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import {
	AddressableFrame,
	AddressableFrameActions,
	AddressableFrameAddress,
	AddressableFrameAddressInput,
	AddressableFrameBar,
	AddressableFrameContent,
	AddressableFrameFooter,
	AddressableFrameHeader,
	AddressableFrameNavigation,
} from './addressable-frame';

describe('addressable frame primitives', () => {
	it('composes address, navigation, content, and status without browser runtime behavior', () => {
		const markup = renderToStaticMarkup(
			<AddressableFrame aria-labelledby='schema-resource-title'>
				<AddressableFrameBar>
					<AddressableFrameNavigation aria-label='Resource history'>history</AddressableFrameNavigation>
					<AddressableFrameAddress icon={<span>file</span>} title='file:///workspace/schema.prisma'>
						file:///workspace/schema.prisma
					</AddressableFrameAddress>
					<AddressableFrameActions>actions</AddressableFrameActions>
				</AddressableFrameBar>
				<AddressableFrameHeader
					title='schema.prisma'
					titleAs='h3'
					titleId='schema-resource-title'
					description='Prisma schema'
					actions='header actions'
				/>
				<AddressableFrameContent>model Resource</AddressableFrameContent>
				<AddressableFrameFooter>UTF-8</AddressableFrameFooter>
			</AddressableFrame>,
		);

		expect(markup).toContain('data-slot="addressable-frame"');
		expect(markup).toContain('data-slot="addressable-frame-bar"');
		expect(markup).toContain('data-slot="addressable-frame-navigation"');
		expect(markup).toContain('data-slot="addressable-frame-address"');
		expect(markup).toContain('data-slot="addressable-frame-address-icon"');
		expect(markup).toContain('data-slot="addressable-frame-actions"');
		expect(markup).toContain('data-slot="addressable-frame-header"');
		expect(markup).toContain('<h3 id="schema-resource-title" title="schema.prisma"');
		expect(markup).toContain('title="Prisma schema"');
		expect(markup).toContain('data-slot="addressable-frame-content"');
		expect(markup).toContain('data-slot="addressable-frame-footer"');
		expect(markup).toContain('file:///workspace/schema.prisma');
		expect(markup).not.toContain('iframe');
		expect(markup).not.toContain('target="_blank"');
	});

	it('lets applications provide an editable or structured address value', () => {
		const markup = renderToStaticMarkup(
			<AddressableFrameAddress icon={<span>uri</span>}>
				<AddressableFrameAddressInput aria-label='Resource address' defaultValue='s3://assets/report.json' />
			</AddressableFrameAddress>,
		);

		expect(markup).toContain('data-slot="addressable-frame-address-input"');
		expect(markup).toContain('focus-within:ring-1');
		expect(markup).toContain('aria-label="Resource address"');
		expect(markup).toContain('value="s3://assets/report.json"');
	});

	it('renders only the primitives selected by the caller', () => {
		const markup = renderToStaticMarkup(
			<AddressableFrame data-testid='minimal-frame'>
				<AddressableFrameContent>content</AddressableFrameContent>
			</AddressableFrame>,
		);

		expect(markup).toContain('data-testid="minimal-frame"');
		expect(markup).toContain('content');
		expect(markup).not.toContain('addressable-frame-bar');
		expect(markup).not.toContain('addressable-frame-header');
		expect(markup).not.toContain('addressable-frame-footer');
	});
});
