import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';

export const TaskListExtension = TaskList.extend({
  renderMarkdown: (state, node) => {
    state.renderList(node, '  ', () => (node.attrs['bullet'] || '*') + ' ');
  },
});

export const TaskItemExtension = TaskItem.extend({
  renderMarkdown: (state, node) => {
    state.write(`[${node.attrs['checked'] ? 'x' : ' '}] `);
    state.renderContent(node);
  },
});
