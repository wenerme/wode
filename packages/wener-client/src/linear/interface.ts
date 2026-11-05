import type { LinearConnectionConfig } from './config';
import type {
	LinearComment, LinearCommentConnection, LinearCreateCommentInput, LinearCreateIssueInput,
	LinearGetIssueInput, LinearIssue, LinearIssueConnection, LinearIssueStateConnection,
	LinearListCommentInput, LinearListIssueInput, LinearListIssueStateInput, LinearListProjectInput,
	LinearListTeamInput, LinearListUserInput, LinearProjectConnection, LinearTeamConnection,
	LinearUpdateIssueInput, LinearUserConnection, LinearViewer,
} from './schema';

export interface LinearCallOptions { signal?: AbortSignal }

/** Transport-neutral operations; no service registry, configuration host or CLI dependency. */
export interface LinearAdapter {
	getViewer(options?: LinearCallOptions): Promise<LinearViewer>;
	listTeam(input?: LinearListTeamInput, options?: LinearCallOptions): Promise<LinearTeamConnection>;
	listIssueState(input: LinearListIssueStateInput, options?: LinearCallOptions): Promise<LinearIssueStateConnection>;
	listUser(input?: LinearListUserInput, options?: LinearCallOptions): Promise<LinearUserConnection>;
	listProject(input?: LinearListProjectInput, options?: LinearCallOptions): Promise<LinearProjectConnection>;
	listIssue(input?: LinearListIssueInput, options?: LinearCallOptions): Promise<LinearIssueConnection>;
	getIssue(input: LinearGetIssueInput, options?: LinearCallOptions): Promise<LinearIssue>;
	createIssue(input: LinearCreateIssueInput, options?: LinearCallOptions): Promise<LinearIssue>;
	updateIssue(input: LinearUpdateIssueInput, options?: LinearCallOptions): Promise<LinearIssue>;
	listComment(input: LinearListCommentInput, options?: LinearCallOptions): Promise<LinearCommentConnection>;
	createComment(input: LinearCreateCommentInput, options?: LinearCallOptions): Promise<LinearComment>;
	close(): Promise<void>;
}
export type LinearAdapterFactory = (config: LinearConnectionConfig) => LinearAdapter | Promise<LinearAdapter>;
