import { CircleCheck } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import { Status } from './status';

describe('status primitive', () => {
	it('defaults to a standalone dot and text status', () => {
		const markup = renderToStaticMarkup(
			<Status tone='success' aria-label='资源状态：正常'>
				正常
			</Status>,
		);

		expect(markup).toContain('data-slot="status"');
		expect(markup).toContain('data-tone="success"');
		expect(markup).toContain('data-variant="plain"');
		expect(markup).toContain('aria-label="资源状态：正常"');
		expect(markup).toContain('bg-success');
		expect(markup).toContain('正常');
		expect(markup).not.toContain('badge');
		expect(markup).not.toContain('rounded-full border');
	});

	it('supports compact pill variants for dense surfaces', () => {
		const markup = renderToStaticMarkup(
			<>
				<Status tone='warning' variant='soft' size='xs'>
					2 项待审
				</Status>
				<Status tone='danger' variant='outline' size='md'>
					离线
				</Status>
			</>,
		);

		expect(markup).toContain('bg-warning/4');
		expect(markup).toContain('border-error/45');
		expect(markup).toContain('text-base-content');
		expect(markup).not.toContain('text-warning-content');
		expect(markup).not.toContain('text-error');
		expect(markup).toContain('2 项待审');
		expect(markup).toContain('离线');
	});

	it('keeps non-solid semantic tones on the theme foreground', () => {
		for (const tone of ['info', 'success', 'warning', 'danger'] as const) {
			for (const variant of ['soft', 'outline'] as const) {
				const markup = renderToStaticMarkup(
					<Status tone={tone} variant={variant}>
						状态
					</Status>,
				);

				expect(markup).toContain('text-base-content');
				expect(markup).not.toContain('text-info');
				expect(markup).not.toContain('text-success');
				expect(markup).not.toContain('text-warning-content');
				expect(markup).not.toContain('text-error');
			}
		}
	});

	it('uses the theme foreground pair and a tone indicator for solid states', () => {
		const markup = renderToStaticMarkup(
			<Status tone='info' variant='solid'>
				运行中
			</Status>,
		);

		expect(markup).toContain('border-info');
		expect(markup).toContain('bg-base-content');
		expect(markup).toContain('text-base-100');
		expect(markup).toContain('bg-info');
		expect(markup).not.toContain('text-info-content');
	});

	it('uses an icon instead of the implicit plain indicator', () => {
		const markup = renderToStaticMarkup(
			<Status tone='success' icon={<CircleCheck data-testid='status-icon' />}>
				已同步
			</Status>,
		);

		expect(markup).toContain('data-testid="status-icon"');
		expect(markup).not.toContain('size-1.5');
	});
});
