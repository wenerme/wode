import * as PublicService from '@wener/common/service';
import * as PublicCli from '@wener/common/service/cli';
import * as PublicCliClient from '@wener/common/service/cli/client';
import * as PublicConfig from '@wener/common/service/config';
import * as PublicRuntime from '@wener/common/service/runtime';
import * as PublicRuntimeClient from '@wener/common/service/runtime/client';
import { expect, it } from 'vitest';
import * as LegacyConfigObject from '../context/configObject';
import * as LegacyConfig from '../context/ServiceConfig';
import * as LegacyCli from './cli';
import * as LegacyCliClient from './cli/client';
import { createServiceCliCommand } from './cli/createServiceCliCommand';
import * as LegacyDefinition from './cli/ServiceCliDefinition';
import { ServiceCliInputError } from './cli/ServiceCliInputError';
import * as LegacyService from './index';
import * as LegacyRuntime from './runtime';
import * as LegacyRuntimeClient from './runtime/client';
import { createHttpServiceRuntimeClient } from './runtime/createHttpServiceRuntimeClient';
import { createServiceRuntime, ServiceProviderRegistry } from './runtime/createServiceRuntime';
import { createRemoteServiceToolClient } from './runtime/createServiceToolClient';

it('preserves public and legacy service entry point identities', () => {
	for (const [legacy, current] of [
		[LegacyService, PublicService],
		[LegacyCli, PublicCli],
		[LegacyCliClient, PublicCliClient],
		[LegacyDefinition, PublicCliClient],
		[LegacyRuntime, PublicRuntime],
		[LegacyRuntimeClient, PublicRuntimeClient],
	] as const) {
		expect(Object.keys(legacy).sort()).toEqual(Object.keys(current).sort());
		for (const [key, value] of Object.entries(legacy)) expect(Reflect.get(current, key), key).toBe(value);
	}
	expect(createServiceCliCommand).toBe(PublicCli.createServiceCliCommand);
	expect(ServiceCliInputError).toBe(PublicCli.ServiceCliInputError);
	expect(createHttpServiceRuntimeClient).toBe(PublicRuntimeClient.createHttpServiceRuntimeClient);
	expect(createRemoteServiceToolClient).toBe(PublicRuntimeClient.createRemoteServiceToolClient);
	expect(createServiceRuntime).toBe(PublicRuntime.createServiceRuntime);
	expect(ServiceProviderRegistry).toBe(PublicRuntime.ServiceProviderRegistry);
	expect(new ServiceProviderRegistry()).toBeInstanceOf(PublicRuntime.ServiceProviderRegistry);
});

it('keeps configuration schemas, helpers and thrown errors identical across the boundary', () => {
	for (const legacy of [LegacyConfigObject, LegacyConfig]) {
		for (const [key, value] of Object.entries(legacy)) expect(Reflect.get(PublicConfig, key), key).toBe(value);
	}
	expect(() => LegacyConfig.normalizeCliServices(null)).toThrow(PublicConfig.CliConfigError);
	expect(() => PublicConfig.normalizeCliServices(null)).toThrow(LegacyConfigObject.CliConfigError);
	expect(() => LegacyCliClient.serviceCliString({ limit: true }, 'limit')).toThrow(PublicCli.ServiceCliInputError);
});
