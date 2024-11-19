import { z } from 'zod';

export type ResourceStateActive = z.infer<typeof ResourceStateActive>;
export const ResourceStateActive = z.literal('Active');

export type ResourceStateInactive = z.infer<typeof ResourceStateInactive>;
export const ResourceStateInactive = z.literal('Inactive');

export type ResourceState = z.infer<typeof ResourceState>;
export const ResourceState = z.union([ResourceStateActive, ResourceStateInactive]);
