import TipTapTaskList from '@tiptap/extension-task-list';
import TipTapTaskItem from '@tiptap/extension-task-item';

export const TaskListExtension = TipTapTaskList.extend({
  renderMarkdown: (state, node) => {
    state.renderList(node, '  ', () => (node.attrs.bullet || '*') + ' ');
  },
});

export const TaskItemExtension = TipTapTaskItem.extend({
  renderMarkdown: (state, node) => {
    state.write(`[${node.attrs.checked ? 'x' : ' '}] `);
    state.renderContent(node);
  },
});
