import { Type, type Static } from '@sinclair/typebox';

type ResourceStateActive = Static<typeof ResourceStateActive>;
const ResourceStateActive = Type.Literal('Active', { title: '启用' });

type ResourceStateInactive = Static<typeof ResourceStateInactive>;
const ResourceStateInactive = Type.Literal('Inactive', { title: '禁用' });

export type ResourceState = Static<typeof ResourceState>;
export const ResourceState = Type.Union([ResourceStateActive, ResourceStateInactive], {
  title: '资源状态',
  $id: 'wode.resource.ResourceState',
});
