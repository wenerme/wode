import { expect, userEvent, waitFor, within } from 'storybook/test';

export async function runInteractionRegression(canvasElement: HTMLElement) {
	canvasElement.dataset.queryBuilderPlay = 'running';
	const canvas = within(canvasElement);
	await userEvent.click(canvas.getByRole('button', { name: '恢复示例' }));
	await waitFor(() => expect(canvas.getAllByText('4 个条件').length).toBeGreaterThan(0));
	const body = within(canvasElement.ownerDocument.body);
	await userEvent.click(canvas.getByRole('button', { name: '已选 2 项' }));
	await body.findByRole('searchbox', { name: '搜索值' });
	await userEvent.keyboard('{End}');
	await expect(body.getByRole('button', { name: '暂停' })).toHaveFocus();
	await userEvent.keyboard('{Home}');
	await expect(body.getByRole('button', { name: '活跃' })).toHaveFocus();
	await userEvent.keyboard('{Escape}');

	const addButtons = canvas.getAllByRole('button', { name: '添加条件' });
	await userEvent.click(addButtons[0]);
	const search = await body.findByRole('searchbox', { name: '搜索字段' });
	await userEvent.type(search, '已归档');
	const archivedOption = await waitFor(() => {
		const option = [
			...canvasElement.ownerDocument.querySelectorAll<HTMLButtonElement>('button[data-query-option="field"]'),
		].find((candidate) => candidate.textContent?.includes('已归档'));
		expect(option).toBeDefined();
		return option as HTMLButtonElement;
	});
	await userEvent.keyboard('{ArrowUp}');
	await expect(archivedOption).toHaveFocus();
	await userEvent.keyboard('{Enter}');
	await expect(canvas.getAllByText('5 个条件').length).toBeGreaterThan(0);
	await expect(canvas.getByRole('group', { name: '已归档条件' })).toBeInTheDocument();

	await userEvent.click(canvas.getByRole('button', { name: '应用更改' }));
	await expect(canvas.getByText('已应用版本 1')).toBeInTheDocument();
	const minimumRevenue = canvas.getAllByRole('spinbutton', { name: '最小值' })[0];
	await userEvent.clear(minimumRevenue);
	await userEvent.type(minimumRevenue, '-12.5');
	await expect(minimumRevenue).toHaveValue(-12.5);
	await userEvent.click(canvas.getByRole('button', { name: '模拟已保存更新' }));
	await expect(canvas.getByText('编辑草稿期间，已保存的查询发生了变化。')).toBeInTheDocument();
	await expect(canvas.getByRole('button', { name: '应用更改' })).toBeDisabled();
	await userEvent.click(canvas.getByRole('button', { name: '模拟已保存更新' }));
	await expect(canvas.queryByText('编辑草稿期间，已保存的查询发生了变化。')).not.toBeInTheDocument();
	await expect(canvas.getByRole('button', { name: '应用更改' })).toBeEnabled();
	await userEvent.click(canvas.getByRole('button', { name: '模拟已保存更新' }));
	await expect(canvas.getByText('编辑草稿期间，已保存的查询发生了变化。')).toBeInTheDocument();
	await userEvent.clear(minimumRevenue);
	await userEvent.type(minimumRevenue, '1000');
	await userEvent.click(canvas.getAllByRole('checkbox', { name: '排除' })[0]);
	await expect(canvas.queryByText('编辑草稿期间，已保存的查询发生了变化。')).not.toBeInTheDocument();
	await expect(canvas.getByRole('button', { name: '应用更改' })).toBeDisabled();
	await userEvent.clear(minimumRevenue);
	await userEvent.type(minimumRevenue, '-12.5');
	await userEvent.click(canvas.getByRole('button', { name: '模拟已保存更新' }));
	await expect(canvas.getByText('编辑草稿期间，已保存的查询发生了变化。')).toBeInTheDocument();
	await userEvent.click(canvas.getByRole('button', { name: '覆盖已保存查询' }));
	await expect(canvas.getByText('已应用版本 2')).toBeInTheDocument();
	await expect(canvas.queryByText('编辑草稿期间，已保存的查询发生了变化。')).not.toBeInTheDocument();
	await userEvent.click(canvas.getByRole('button', { name: '恢复示例' }));
	await waitFor(() => expect(canvas.getByText('已应用版本 0')).toBeInTheDocument());
	canvasElement.dataset.queryBuilderPlay = 'complete';
}

export async function runControlledRejection(canvasElement: HTMLElement) {
	canvasElement.dataset.queryControlledPlay = 'running';
	const canvas = within(canvasElement);
	const rootNot = canvas.getAllByRole('checkbox', { name: '排除' })[0];
	await userEvent.click(rootNot);
	await userEvent.click(rootNot);
	await userEvent.click(canvas.getByRole('button', { name: '查看变更提议' }));
	await expect(canvas.getByRole('status', { name: '提议的排除状态' })).toHaveTextContent('true, true');
	await expect(rootNot).not.toBeChecked();
	const minimumRevenue = canvas.getByRole('spinbutton', { name: '最小值' });
	await userEvent.clear(minimumRevenue);
	await waitFor(() => expect(minimumRevenue).toHaveValue(1000));
	canvasElement.dataset.queryControlledPlay = 'complete';
}

export async function runDraftApplyRejection(canvasElement: HTMLElement) {
	canvasElement.dataset.queryDraftRejectionPlay = 'running';
	const canvas = within(canvasElement);
	const rootNot = canvas.getAllByRole('checkbox', { name: '排除' })[0];
	await userEvent.click(rootNot);
	await userEvent.click(canvas.getByRole('button', { name: '提交草稿' }));
	await expect(canvas.getByRole('status', { name: '草稿提议' })).toHaveTextContent('1 次提议');
	await expect(rootNot).toBeChecked();
	await expect(canvas.getByRole('button', { name: '提交草稿' })).toBeEnabled();
	await userEvent.click(canvas.getByRole('button', { name: '重置草稿' }));
	await expect(rootNot).not.toBeChecked();
	canvasElement.dataset.queryDraftRejectionPlay = 'complete';
}
