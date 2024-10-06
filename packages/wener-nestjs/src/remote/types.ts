/**
 * @$id: ResolveResourceRequest
 */
export interface ResolveResourceRequest {
  // tid, cid, rid, sid

  id?: string;
  uid?: string;
  eid?: string;
  cid?: string;
  rid?: string;
  select?: string[];
  include?: string[];
  deleted?: boolean;
}

/**
 * @$id: GetResourceRequest
 */
export interface GetResourceRequest extends HasSelection, HasFilter {
  id: string;
}

/**
 * @$id: DeleteResourceRequest
 */
export interface DeleteResourceRequest extends GetResourceRequest {}

/**
 * @$id: UndeleteResourceRequest
 */
export interface UndeleteResourceRequest extends GetResourceRequest {}

/**
 * @$id: PurgeResourceRequest
 */
export interface PurgeResourceRequest extends GetResourceRequest {}

interface ModifyResourceRequest<T> extends GetResourceRequest {
  data: T;
}

interface ActionResponse<T = any> {
  status?: number;
  code?: string | number;
  message?: string;
  detail?: Record<string, any>;
  data?: T;
  metadata?: Record<string, any>;
}

export interface GeneralActionResponse {
  status?: number;
  code?: string | number;
  message?: string;
  detail?: Record<string, any>;
  data?: any;
  metadata?: Record<string, any>;
}

interface HasOnConflict {
  onConflictFields?: string[];
  onConflictAction?: 'ignore' | 'merge';
  onConflictMergeFields?: string[];
  onConflictExcludeFields?: string[];
}

interface HasPagination {
  pageSize?: number;
  pageIndex?: number;
  pageNumber?: number;
  limit?: number;
  offset?: number;
  order?: string[];
}

interface HasFilter {
  ids?: string[];
  search?: string;
  filter?: string;
  filters?: string[];
  deleted?: boolean;
}

interface HasSelection {
  include?: string[];
  exclude?: string[];
  select?: string[];
}

/**
 * @$id: ListResourceRequest
 */
export interface ListResourceRequest extends HasPagination, HasFilter, HasSelection {}

/**
 * @$id: ListResourceResponse
 */
export interface ListResourceResponse<T = any> {
  data: T[];
  total: number;
}

/**
 * @$id: CountResourceRequest
 */
export interface CountResourceRequest extends HasFilter {}

/**
 * @$id: SetStateRequest
 */
export interface SetStateRequest extends GetResourceRequest {
  state: string;
  status?: string;
  comment?: string;
  metadata?: Record<string, any>;
}

export interface SetStateResponse extends GeneralActionResponse {}

export interface CreateResourceRequest<T = any> extends ModifyResourceRequest<T>, GetResourceRequest, HasOnConflict {
  // returning?: boolean;
  // extends ModifyResourceRequest<T> 会导致类型过于复杂
  // data: T;
  upsert?: boolean;
}

/**
 * @$id: CreateAnyResourceRequest
 */
export interface CreateAnyResourceRequest extends CreateResourceRequest<any> {}

export interface UpdateResourceRequest<T = any> extends ModifyResourceRequest<T> {}

/**
 * @$id: PatchResourceRequest
 */
export interface UpdateAnyResourceRequest extends UpdateResourceRequest<any> {}

export interface PatchResourceRequest<T = any> extends ModifyResourceRequest<T> {}

/**
 * @$id: PatchAnyResourceRequest
 */
export interface PatchAnyResourceRequest extends PatchResourceRequest<any> {}

export interface ImportResourceRequest<T = any> extends HasOnConflict {
  data: T[];
}

/**
 * @$id: ImportAnyResourceRequest
 */
export interface ImportAnyResourceRequest extends ImportResourceRequest<any> {}

export interface ImportResourceResponse {
  total: number;
}

/**
 * @$id: AssignOwnerRequest
 */
export interface AssignOwnerRequest extends GetResourceRequest {
  ownerId: string;
  ownerType: string;
}

/**
 * @$id: AssignOwnerResponse
 */
export interface AssignOwnerResponse extends GeneralActionResponse {}

/**
 * @$id: ClaimOwnerRequest
 */
export interface ClaimOwnerRequest extends GetResourceRequest {
  userId?: string;
}

/**
 * @$id: ClaimOwnerResponse
 */
export interface ClaimOwnerResponse extends GeneralActionResponse {}

/**
 * @$id: ReleaseOwnerRequest
 */
export interface ReleaseOwnerRequest extends GetResourceRequest {}

/**
 * @$id: ReleaseOwnerResponse
 */
export interface ReleaseOwnerResponse extends GeneralActionResponse {}

/**
 * @$id: GeneralResponse
 */
export interface GeneralResponse<T = any> {
  status?: number;
  code?: string | number;
  message?: string;
  detail?: Record<string, any>;
  metadata?: Record<string, any>;
  data?: T;
}
