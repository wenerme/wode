import type { QueryValueEditorComponent, QueryValueEditorRenderer } from './query-editors';
import type { QueryBuilderMessages } from './query-messages';
import type { QueryField, QueryGroup, QueryIdFactory, QueryOperator } from './query-model';
import type { QueryAction, QueryValidationIssue } from './query-state';

export type QueryBuilderContext = {
	fields: readonly QueryField[];
	fieldMap: ReadonlyMap<string, QueryField>;
	operators: readonly QueryOperator[];
	operatorMap: ReadonlyMap<string, QueryOperator>;
	messages: QueryBuilderMessages;
	issuesByNode: ReadonlyMap<string, readonly QueryValidationIssue[]>;
	valueEditors?: Readonly<Record<string, QueryValueEditorComponent>>;
	renderValueEditor?: QueryValueEditorRenderer;
	createId: QueryIdFactory;
	maxDepth: number;
	readOnly: boolean;
	disabled: boolean;
	showValidation: boolean;
	instanceId: string;
	dispatch: (action: QueryAction) => QueryGroup;
	collapsed: ReadonlySet<string>;
	toggleCollapsed: (id: string) => void;
};
