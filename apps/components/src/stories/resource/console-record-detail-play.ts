import { expect, userEvent, within } from 'storybook/test';

type PlayContext = {
	canvasElement: HTMLElement;
};

export async function playContactRecord({ canvasElement }: PlayContext) {
	const canvas = within(canvasElement);
	await expect(canvas.getByRole('heading', { level: 1, name: '林澄' })).toBeInTheDocument();
	await expect(canvas.getByRole('toolbar', { name: '联系人操作' })).toBeInTheDocument();
	await userEvent.click(canvas.getByRole('tab', { name: /活动/ }));
	await expect(canvas.getByRole('heading', { name: '全部活动' })).toBeInTheDocument();
	await userEvent.click(canvas.getByRole('tab', { name: '概况' }));
	await userEvent.click(canvas.getByRole('button', { name: '编辑' }));
	await expect(canvas.getByRole('status')).toHaveTextContent('编辑中');
	const nameInput = canvas.getByRole('textbox', { name: '姓名' });
	await userEvent.clear(nameInput);
	await userEvent.type(nameInput, '林澄（更新）');
	await expect(canvas.getByRole('status')).toHaveTextContent('有未保存的更改');
	await userEvent.click(canvas.getByRole('button', { name: '取消' }));
	await expect(canvas.getByRole('status')).toHaveTextContent('已保存');
	await expect(canvas.getByRole('heading', { level: 1, name: '林澄' })).toBeInTheDocument();
	await expect(canvas.queryByRole('textbox', { name: '姓名' })).not.toBeInTheDocument();
	await userEvent.click(canvas.getByRole('button', { name: '编辑' }));
	const savedNameInput = canvas.getByRole('textbox', { name: '姓名' });
	await userEvent.clear(savedNameInput);
	await userEvent.type(savedNameInput, '林澄（更新）');
	await userEvent.click(canvas.getByRole('tab', { name: '详情' }));
	await userEvent.click(canvas.getByRole('tab', { name: '概况' }));
	await expect(canvas.getByRole('textbox', { name: '姓名' })).toHaveValue('林澄（更新）');
	await userEvent.click(canvas.getByRole('button', { name: '保存' }));
	await expect(canvas.getByRole('status')).toHaveTextContent('已保存');
	await expect(canvas.getByRole('heading', { level: 1, name: '林澄（更新）' })).toBeInTheDocument();
	await expect(canvas.queryByRole('textbox', { name: '姓名' })).not.toBeInTheDocument();
}
