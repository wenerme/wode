/**
 * @$id: ResolveEntityRequest
 */
export interface ResolveEntityRequest {
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
 * @$id: GetEntityRequest
 */
export interface GetEntityRequest extends HasSelection, HasFilter {
  id: string;
}

/**
 * @$id: DeleteEntityRequest
 */
export interface DeleteEntityRequest extends GetEntityRequest {}

/**
 * @$id: UndeleteEntityRequest
 */
export interface UndeleteEntityRequest extends GetEntityRequest {}

/**
 * @$id: PurgeEntityRequest
 */
export interface PurgeEntityRequest extends GetEntityRequest {}

interface ModifyEntityRequest<T> extends GetEntityRequest {
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
 * @$id: ListEntityRequest
 */
export interface ListEntityRequest extends HasPagination, HasFilter, HasSelection {}

/**
 * @$id: ListEntityResponse
 */
export interface ListEntityResponse<T = any> {
  data: T[];
  total: number;
}

/**
 * @$id: CountEntityRequest
 */
export interface CountEntityRequest extends HasFilter {}

/**
 * @$id: SetStateRequest
 */
export interface SetStateRequest extends GetEntityRequest {
  state: string;
  status?: string;
  comment?: string;
  metadata?: Record<string, any>;
}

export interface SetStateResponse extends GeneralActionResponse {}

export interface CreateEntityRequest<T = any> extends ModifyEntityRequest<T>, GetEntityRequest, HasOnConflict {
  // returning?: boolean;
  // extends ModifyEntityRequest<T> 会导致类型过于复杂
  // data: T;
  upsert?: boolean;
}

/**
 * @$id: CreateAnyEntityRequest
 */
export interface CreateAnyEntityRequest extends CreateEntityRequest<any> {}

export interface UpdateEntityRequest<T = any> extends ModifyEntityRequest<T> {}

/**
 * @$id: PatchEntityRequest
 */
export interface UpdateAnyEntityRequest extends UpdateEntityRequest<any> {}

export interface PatchEntityRequest<T = any> extends ModifyEntityRequest<T> {}

/**
 * @$id: PatchAnyEntityRequest
 */
export interface PatchAnyEntityRequest extends PatchEntityRequest<any> {}

export interface ImportEntityRequest<T = any> extends HasOnConflict {
  data: T[];
}

/**
 * @$id: ImportAnyEntityRequest
 */
export interface ImportAnyEntityRequest extends ImportEntityRequest<any> {}

export interface ImportEntityResponse {
  total: number;
}

/**
 * @$id: AssignOwnerRequest
 */
export interface AssignOwnerRequest extends GetEntityRequest {
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
export interface ClaimOwnerRequest extends GetEntityRequest {
  userId?: string;
}

/**
 * @$id: ClaimOwnerResponse
 */
export interface ClaimOwnerResponse extends GeneralActionResponse {}

/**
 * @$id: ReleaseOwnerRequest
 */
export interface ReleaseOwnerRequest extends GetEntityRequest {}

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
