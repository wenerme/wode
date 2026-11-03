import { type CliCommand, type CliCommandResult, type CliOptions, CliUsageError, renderCliOutput, resolveCliOutputSelection } from '@wener/common/cli';
import { getCliOutputOptions } from '@wener/common/cli/getCliOutputOptions';
import { isCliServiceEnabled, type ResolvedCliContext } from 'common/context';
import { writeCommandOutput } from '../command-utils';
import { VERSION } from '../core';
import type { WocliExecution } from '../createWocliCli';

export interface DiagnosticsOptions {
	supportsProvider(provider: string): boolean;
}

interface ServiceCheck {
	name: string;
	provider: string;
	status: 'enabled' | 'disabled' | 'unsupported';
}
interface CheckIssue {
	severity: 'error' | 'warning';
	code: string;
	message: string;
	service?: string;
}
interface CheckResult {
	ok: boolean;
	context: string;
	services: ServiceCheck[];
	defaults: Readonly<Record<string, string>>;
	issues: CheckIssue[];
}

const strictOption = { name: 'strict', type: 'boolean' as const, description: 'Treat warnings as failures' };

function checkContext(context: ResolvedCliContext, options: DiagnosticsOptions, strict: boolean): CheckResult {
	const configured = context.configuredServices ?? context.services;
	const services: ServiceCheck[] = Object.entries(configured).map(([name, service]) => ({
		name,
		provider: service.provider,
		status: !isCliServiceEnabled(service)
			? 'disabled'
			: options.supportsProvider(service.provider)
				? 'enabled'
				: 'unsupported',
	}));
	const issues: CheckIssue[] = [];
	for (const service of services) {
		if (service.status === 'unsupported')
			issues.push({
				severity: 'warning',
				code: 'unsupported-provider',
				message: `Service provider is unsupported: ${service.provider}`,
				service: service.name,
			});
	}
	for (const [provider, name] of Object.entries(context.defaults)) {
		if (!Object.hasOwn(configured, name)) {
			issues.push({
				severity: 'error',
				code: 'missing-default',
				message: `Default service does not exist for provider ${provider}: ${name}`,
				service: name,
			});
			continue;
		}
		const service = configured[name];
		if (!service) continue;
		if (!isCliServiceEnabled(service)) {
			issues.push({
				severity: 'error',
				code: 'disabled-default',
				message: `Default service is disabled for provider ${provider}: ${name}`,
				service: name,
			});
		}
		if (service.provider !== provider) {
			issues.push({
				severity: 'error',
				code: 'default-provider-mismatch',
				message: `Default service provider does not match ${provider}: ${name}`,
				service: name,
			});
		}
	}
	const failed = issues.some((issue) => issue.severity === 'error' || (strict && issue.severity === 'warning'));
	return { ok: !failed, context: context.name, services, defaults: context.defaults, issues };
}

function strict(options: CliOptions): boolean {
	return options.strict === true;
}

function checkCommand(name: string, description: string, options: DiagnosticsOptions): CliCommand<WocliExecution> {
	return {
		name,
		description,
		options: [strictOption],
		async run({ options: inputOptions }, context) {
			const result = checkContext(context.getConfigContext(inputOptions), options, strict(inputOptions));
			writeCommandOutput(result, inputOptions, context);
			return { exitCode: result.ok ? 0 : 1 } satisfies CliCommandResult;
		},
	};
}

export function createDiagnosticsCommands(options: DiagnosticsOptions) {
	const info: CliCommand<WocliExecution> = {
		name: 'info',
		description: 'Show runtime and configuration summaries',
		async run({ options: inputOptions }, context) {
			const resolved = context.configError ? undefined : context.getConfigContext(inputOptions);
			const configured = resolved?.configuredServices ?? resolved?.services ?? {};
			const services = Object.values(configured);
			const enabled = services.filter((service) => isCliServiceEnabled(service));
			const unsupported = enabled.filter((service) => !options.supportsProvider(service.provider));
			const providers = Object.values(resolved?.providers ?? {});
			const modelCount = providers.reduce((count, provider) => count + Object.keys(provider.models ?? {}).length, 0);
			const value = {
				runtime: context.host.info?.runtime ?? null,
				version: VERSION,
				node: context.host.info?.node ?? null,
				platform: context.host.info?.platform ?? null,
				arch: context.host.info?.arch ?? null,
				cwd: context.host.info?.cwd ?? null,
				context: resolved?.name ?? context.selectedContext ?? null,
				configPath: context.host.info?.configPath ?? null,
				services: {
					configured: services.length,
					enabled: enabled.length,
					disabled: services.length - enabled.length,
					unsupported: unsupported.length,
				},
				ai: {
					providers: providers.length,
					models: modelCount,
					prompts: Object.keys(resolved?.prompts ?? {}).length,
				},
				terminal: {
					kind: context.host.term?.kind ?? null,
					stdinIsTTY: context.host.term?.stdinIsTTY ?? false,
					stdoutIsTTY: context.host.term?.stdoutIsTTY ?? false,
					columns: context.host.term?.columns ?? null,
					rows: context.host.term?.rows ?? null,
					term: context.host.env?.TERM ?? null,
					program: context.host.env?.TERM_PROGRAM ?? null,
				},
				error: context.configError ? 'Configuration unavailable' : null,
			};
			const selection = resolveCliOutputSelection(inputOptions);
			if (selection.fields?.length || !['table', 'wide', 'describe', 'desc'].includes(selection.format)) {
				writeCommandOutput(value, inputOptions, context);
				return;
			}
			const yesNo = (item: boolean) => item ? 'yes' : 'no';
			const sections: Array<[string, Record<string, unknown>]> = [
				['System', {
					CLI: `woctl ${value.version}`,
					Runtime: [value.runtime, value.node].filter(Boolean).join(' ') || '(not provided)',
					Platform: [value.platform, value.arch].filter(Boolean).join('/') || '(not provided)',
					...(value.cwd ? { CWD: value.cwd } : {}),
				}],
				['Config', {
					Context: value.context,
					File: value.configPath ?? '(in memory)',
					Status: value.error ?? 'loaded',
					Defaults: Object.entries(resolved?.defaults ?? {}).map(([type, name]) => `${type}=${name}`).join(', ') || '(none)',
				}],
				['Services', {
					Catalog: `${services.length} configured, ${enabled.length} enabled, ${services.length - enabled.length} disabled, ${unsupported.length} unsupported`,
					AI: `${providers.length} providers, ${modelCount} models, ${value.ai.prompts} prompts`,
					MCP: `${Object.keys(resolved?.mcpServers ?? {}).length} servers`,
				}],
				['Terminal', {
					Kind: value.terminal.kind ?? '(not provided)',
					'TTY (in/out)': `${yesNo(value.terminal.stdinIsTTY)}/${yesNo(value.terminal.stdoutIsTTY)}`,
					...(value.terminal.columns && value.terminal.rows ? { Size: `${value.terminal.columns} x ${value.terminal.rows}` } : {}),
					...(value.terminal.term ? { TERM: value.terminal.term } : {}),
					...(value.terminal.program ? { Program: value.terminal.program } : {}),
				}],
			];
			const layout = { ...getCliOutputOptions(context, inputOptions), fields: undefined, footer: false };
			context.stdout(sections.map(([title, fields]) => `${title}:\n${renderCliOutput(fields, layout).trimEnd()}`).join('\n\n'));
		},
	};
	return {
		info,
		contextCheck: checkCommand('check', 'Validate the current context configuration offline', options),
		serviceVerify: { ...checkCommand('verify', 'Validate the current service configuration offline', options), aliases: ['check'] },
	};
}

export function parseLogLevel(value: string | undefined): LogLevel {
	if (value === undefined || value === '') return 'error';
	if (!LOG_LEVELS.includes(value as LogLevel)) throw new CliUsageError(`Invalid --log-level: ${value}`);
	return value as LogLevel;
}

export const LOG_LEVELS = ['trace', 'verbose', 'debug', 'info', 'warning', 'error'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];
const LOG_RANK: Record<LogLevel, number> = { trace: 0, verbose: 1, debug: 2, info: 3, warning: 4, error: 5 };

export function shouldLog(configured: LogLevel, level: LogLevel): boolean {
	return LOG_RANK[level] >= LOG_RANK[configured];
}
