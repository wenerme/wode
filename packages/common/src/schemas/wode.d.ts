/**
 * @title 启用
 */
type ResourceStateActive = 'Active';
/**
 * @title 禁用
 */
type ResourceStateInactive = 'Inactive';

/**
 * @title 资源状态
 * @$id wode.resource.ResourceState
 */
export type ResourceState = ResourceStateActive | ResourceStateInactive;
