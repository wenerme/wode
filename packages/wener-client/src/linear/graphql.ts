const UserFields = `id name displayName email active`;
const TeamFields = `id key name description`;
const StateFields = `id name type color position`;
const ProjectFields = `
  id name description priority health startDate targetDate createdAt updatedAt url
  status { id name type color }
  teams { nodes { id key name description } }
`;
const IssueFields = `
  id identifier title description url branchName priority estimate dueDate
  createdAt updatedAt archivedAt completedAt canceledAt
  team { ${TeamFields} }
  state { ${StateFields} }
  assignee { ${UserFields} }
  creator { ${UserFields} }
  project { id name }
  labels { nodes { id name color } }
`;
const CommentFields = `id body createdAt updatedAt user { ${UserFields} }`;

export const LinearGraphql = Object.freeze({
	viewer: `query LinearViewer { viewer { ${UserFields} } }`,
	teams: `query LinearTeams($first: Int!, $after: String, $includeArchived: Boolean!) {
  teams(first: $first, after: $after, includeArchived: $includeArchived) {
    nodes { ${TeamFields} }
    pageInfo { hasNextPage endCursor }
  }
}`,
	issueStates: `query LinearIssueStates($teamId: String!, $first: Int!, $after: String) {
  team(id: $teamId) {
    states(first: $first, after: $after) {
      nodes { ${StateFields} }
      pageInfo { hasNextPage endCursor }
    }
  }
}`,
	users: `query LinearUsers($first: Int!, $after: String, $includeArchived: Boolean!, $filter: UserFilter) {
  users(first: $first, after: $after, includeArchived: $includeArchived, filter: $filter) {
    nodes { ${UserFields} }
    pageInfo { hasNextPage endCursor }
  }
}`,
	projects: `query LinearProjects($first: Int!, $after: String, $includeArchived: Boolean!, $filter: ProjectFilter) {
  projects(first: $first, after: $after, includeArchived: $includeArchived, filter: $filter) {
    nodes { ${ProjectFields} }
    pageInfo { hasNextPage endCursor }
  }
}`,
	issues: `query LinearIssues($first: Int!, $after: String, $includeArchived: Boolean!, $filter: IssueFilter) {
  issues(first: $first, after: $after, includeArchived: $includeArchived, filter: $filter, orderBy: updatedAt) {
    nodes { ${IssueFields} }
    pageInfo { hasNextPage endCursor }
  }
}`,
	issue: `query LinearIssue($id: String!) { issue(id: $id) { ${IssueFields} } }`,
	issueCreate: `mutation LinearIssueCreate($input: IssueCreateInput!) {
  issueCreate(input: $input) { success issue { ${IssueFields} } }
}`,
	issueUpdate: `mutation LinearIssueUpdate($id: String!, $input: IssueUpdateInput!) {
  issueUpdate(id: $id, input: $input) { success issue { ${IssueFields} } }
}`,
	comments: `query LinearComments($issueId: String!, $first: Int!, $after: String) {
  issue(id: $issueId) {
    comments(first: $first, after: $after) {
      nodes { ${CommentFields} }
      pageInfo { hasNextPage endCursor }
    }
  }
}`,
	commentCreate: `mutation LinearCommentCreate($input: CommentCreateInput!) {
  commentCreate(input: $input) { success comment { ${CommentFields} } }
}`,
});
