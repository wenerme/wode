import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import { Message, MessageAvatar, MessageContent, MessageFooter, MessageGroup, MessageHeader } from './index';

describe('Message', () => {
	it('renders the official composable layout with stable slots and alignment', () => {
		const markup = renderToStaticMarkup(
			<MessageGroup>
				<Message align='end'>
					<MessageAvatar>A</MessageAvatar>
					<MessageContent>
						<MessageHeader>用户</MessageHeader>
						<p>你好</p>
						<MessageFooter>刚刚</MessageFooter>
					</MessageContent>
				</Message>
			</MessageGroup>,
		);
		expect(markup).toContain('data-slot="message-group"');
		expect(markup).toContain('data-slot="message"');
		expect(markup).toContain('data-align="end"');
		expect(markup).toContain('data-slot="message-avatar"');
		expect(markup).toContain('data-slot="message-content"');
		expect(markup).toContain('data-slot="message-header"');
		expect(markup).toContain('data-slot="message-footer"');
	});
});
