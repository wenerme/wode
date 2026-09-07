import type { ConnectionOptions, NatsConnection } from '@nats-io/nats-core';
import { ConfigurableModuleBuilder, Inject, Logger, Module } from '@nestjs/common';
import { connect as defaultConnect, defineNatsConfig } from './connect';

export const NATS_CONNECTION = Symbol.for('NATS_CONNECTION');

export const InjectNatsClient = () => Inject(NATS_CONNECTION);
export const NatsConn = NATS_CONNECTION;
export type NatsConn = NatsConnection;

export interface NatsModuleOptions {
	connect?: (opts: Partial<ConnectionOptions>) => Promise<NatsConnection>;
	options?: Partial<ConnectionOptions>;
}

const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } = new ConfigurableModuleBuilder<NatsModuleOptions>()
	.setExtras({ isGlobal: true }, (definition, extras) => ({ ...definition, global: extras.isGlobal }))
	.setClassMethodName('forRoot')
	.build();

@Module({
	exports: [NATS_CONNECTION, NatsConn],
	providers: [
		{ provide: NatsConn, useExisting: NATS_CONNECTION },
		{
			provide: NATS_CONNECTION,
			async useFactory({ options = {}, connect = defaultConnect }: NatsModuleOptions = {}) {
				const connectionOptions = defineNatsConfig(options);
				const servers = Array.from(connectionOptions.servers ?? [])
					.flat()
					.map((v) => maskUrl(v))
					.join(', ');
				log.log(`connecting: ${servers}`);
				const client = await connect(connectionOptions);
				log.log('connected');
				return client;
			},
			inject: [{ token: MODULE_OPTIONS_TOKEN, optional: true }],
		},
	],
})
export class NatsModule extends ConfigurableModuleClass {}

const log = new Logger(NatsModule.name);

function maskUrl(s: string) {
	if (!/^\w+:\/\//.test(s)) {
		s = `nats://${s}`;
	}

	return s.replace(/:\/\/.*@/, '://***:***@');
}
