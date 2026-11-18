import { isValidTelegramBotToken } from '@wener/client/telegram';
import { serviceCliString, type ServiceCliAdHocDefinition } from '../../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../../cli/ServiceCliInputError';

const tokenEnv = 'WOCTL_AD_HOC_TELEGRAM_TOKEN';

export const TelegramAdHocConnection: ServiceCliAdHocDefinition = {
	options: ['token', 'read-only'],
	create(options) {
		const token = serviceCliString(options, 'token');
		if (token === undefined) throw new ServiceCliInputError('Ad hoc Telegram requires --token');
		if (!isValidTelegramBotToken(token)) throw new ServiceCliInputError('Invalid Telegram bot token');
		return {
			readOnly: options['read-only'] === true,
			options: { botTokenEnv: tokenEnv },
			getEnv: (name) => name === tokenEnv ? token : undefined,
		};
	},
};
