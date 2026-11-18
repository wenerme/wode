/**
 * Narrow, opt-in bypass for the read-only guard: only applies when the tool/operation itself
 * declares `supportsDryRun: true` *and* the caller's input is a plain object with `dryRun: true`.
 * This never bypasses read-only for tools that don't explicitly support it (e.g. Grafana's
 * generic `request`, whose body may carry an arbitrary `dryRun` field that must not grant it
 * write access).
 */
export function isDryRunBypass(supportsDryRun: boolean | undefined, input: unknown): boolean {
	if (supportsDryRun !== true) return false;
	if (input === null || typeof input !== 'object' || Array.isArray(input)) return false;
	return (input as Record<string, unknown>).dryRun === true;
}
