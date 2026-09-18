import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import {
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerProvider,
	MessageScrollerViewport,
	useMessageScroller,
	useMessageScrollerScrollable,
	useMessageScrollerVisibility,
} from './index';

function HookProbe() {
	const commands = useMessageScroller();
	const scrollable = useMessageScrollerScrollable();
	const visibility = useMessageScrollerVisibility();
	return (
		<output>
			{typeof commands.scrollToEnd}:{String(scrollable.start)}:{String(scrollable.end)}:
			{visibility.visibleMessageIds.length}
		</output>
	);
}

describe('MessageScroller', () => {
	it('integrates official parts, commands, visibility, reader semantics, and Chinese labels during SSR', () => {
		const markup = renderToStaticMarkup(
			<MessageScrollerProvider autoScroll defaultScrollPosition='last-anchor'>
				<MessageScroller className='h-80'>
					<MessageScrollerViewport>
						<MessageScrollerContent>
							<MessageScrollerItem messageId='message-1' scrollAnchor>
								消息一
							</MessageScrollerItem>
						</MessageScrollerContent>
					</MessageScrollerViewport>
					<MessageScrollerButton />
					<HookProbe />
				</MessageScroller>
			</MessageScrollerProvider>,
		);
		expect(markup).toContain('data-slot="message-scroller"');
		expect(markup).toContain('aria-label="消息记录"');
		expect(markup).toContain('role="log"');
		expect(markup).toContain('aria-relevant="additions"');
		expect(markup).toContain('data-message-id="message-1"');
		expect(markup).toContain('[content-visibility:auto]');
		expect(markup).toContain('滚动到底部');
		expect(markup).toContain('function:false:false:0');
	});

	it('allows all assistive labels to be overridden', () => {
		const messages = { viewportLabel: 'Transcript', scrollToStart: 'Go first', scrollToEnd: 'Go last' };
		const markup = renderToStaticMarkup(
			<MessageScrollerProvider>
				<MessageScroller>
					<MessageScrollerViewport messages={messages}>
						<MessageScrollerContent />
					</MessageScrollerViewport>
					<MessageScrollerButton direction='start' messages={messages} />
				</MessageScroller>
			</MessageScrollerProvider>,
		);
		expect(markup).toContain('aria-label="Transcript"');
		expect(markup).toContain('Go first');
	});
});
