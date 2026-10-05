import { z } from 'zod';
import type { WindowManagerSnapshot } from '../WindowManagerTypes';
import { WINDOW_MANAGER_SNAPSHOT_VERSION } from '../WindowManagerTypes';
const finiteNumberSchema = z.number().finite(); const finitePositiveSchema = finiteNumberSchema.positive(); const finiteNonNegativeSchema = finiteNumberSchema.nonnegative();
const boundsSchema = z.object({ x: finiteNumberSchema, y: finiteNumberSchema, width: finitePositiveSchema, height: finitePositiveSchema }).loose();
const capabilitiesSchema = z.object({ close: z.boolean(), fullscreen: z.boolean(), maximize: z.boolean(), minimize: z.boolean(), move: z.boolean(), resize: z.boolean() }).loose();
const sizeSchema = z.object({ minWidth: finitePositiveSchema, minHeight: finitePositiveSchema, maxWidth: finitePositiveSchema.optional(), maxHeight: finitePositiveSchema.optional() }).loose();
const dockSchema = z.object({ visible: z.boolean(), position: z.enum(['bottom', 'left', 'right']), size: finiteNonNegativeSchema });
const snapshotWindowSchema = z.object({ id: z.string().min(1), key: z.string().optional(), kind: z.string(), title: z.string(), icon: z.string().optional(), bounds: boundsSchema, size: sizeSchema, capabilities: capabilitiesSchema, mode: z.enum(['normal', 'minimized', 'maximized', 'fullscreen']), restoreMode: z.enum(['normal', 'maximized', 'fullscreen']), fullscreenRestoreMode: z.enum(['normal', 'maximized']), chrome: z.enum(['default', 'none']), showInDock: z.boolean(), persistence: z.literal('layout'), pinned: z.boolean().optional() }).loose();
export const windowManagerSnapshotSchema = z.object({ version: z.literal(WINDOW_MANAGER_SNAPSHOT_VERSION), savedAt: finiteNumberSchema, dock: dockSchema, order: z.array(z.string()), dockOrder: z.array(z.string()).optional(), windows: z.array(snapshotWindowSchema) }).superRefine((snapshot, ctx) => {
	if (hasDuplicates(snapshot.order)) ctx.addIssue({ code: 'custom', message: 'order contains duplicate ids' });
	if (snapshot.dockOrder && hasDuplicates(snapshot.dockOrder)) ctx.addIssue({ code: 'custom', message: 'dockOrder contains duplicate ids' });
	const ids = new Set<string>(); for (const item of snapshot.windows) { if (ids.has(item.id)) { ctx.addIssue({ code: 'custom', message: `duplicate window id: ${item.id}` }); return; } ids.add(item.id); }
	if (!isExactIdSet(snapshot.order, ids)) ctx.addIssue({ code: 'custom', message: 'order does not match the window id set' });
	if (snapshot.dockOrder && !isExactIdSet(snapshot.dockOrder, ids)) ctx.addIssue({ code: 'custom', message: 'dockOrder does not match the window id set' });
});
function hasDuplicates(values: readonly string[]): boolean { return new Set(values).size !== values.length; }
function isExactIdSet(values: readonly string[], ids: ReadonlySet<string>): boolean { return values.length === ids.size && values.every((id) => ids.has(id)); }
export function isWindowManagerSnapshot(value: unknown): value is WindowManagerSnapshot { return windowManagerSnapshotSchema.safeParse(value).success; }
