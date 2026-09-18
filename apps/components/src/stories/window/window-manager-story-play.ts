import { expect, userEvent, waitFor, within } from 'storybook/test';

export async function playInteractiveWindowManagerStory({ canvasElement }: { canvasElement: HTMLElement }) {
	const canvas = within(canvasElement);
	await expect(canvas.getAllByRole('dialog')).toHaveLength(3);
	const surface = canvasElement.querySelector('[data-window-id="runbook"]');
	expect(surface).toHaveAttribute('data-window-mode', 'normal');

	const runbook = canvas.getByRole('dialog', { name: 'Runbook' });
	const titleBar = runbook.querySelector('header');
	expect(titleBar).not.toBeNull();
	const menuTrigger = within(runbook).getByRole('button', { name: '窗口菜单' });
	const documentBody = within(canvasElement.ownerDocument.body);
	const motionSurface = surface?.parentElement?.parentElement as HTMLElement | undefined;
	expect(motionSurface).toBeDefined();
	const transformBeforeCenter = motionSurface?.style.transform;
	await userEvent.click(menuTrigger);
	await userEvent.click(await findPointerReadyMenuItem(documentBody, '窗口居中'));
	await waitFor(() => expect(motionSurface?.style.transform).not.toBe(transformBeforeCenter));
	await userEvent.click(menuTrigger);
	await userEvent.click(await findPointerReadyMenuItem(documentBody, '窗口置顶'));
	expect(surface).toHaveAttribute('data-window-pinned', 'true');
	await userEvent.click(menuTrigger);
	await userEvent.click(await findPointerReadyMenuItem(documentBody, '取消置顶'));
	expect(surface).not.toHaveAttribute('data-window-pinned');
	await userEvent.dblClick(within(runbook).getByRole('button', { name: '最大化' }));
	expect(surface).toHaveAttribute('data-window-mode', 'normal');
	await userEvent.dblClick(titleBar as HTMLElement);
	expect(surface).toHaveAttribute('data-window-mode', 'maximized');
	await userEvent.click(within(runbook).getByRole('button', { name: '工作区全屏' }));
	expect(surface).toHaveAttribute('data-window-mode', 'fullscreen');
	await expect(canvas.queryByRole('navigation', { name: '窗口停靠栏' })).not.toBeInTheDocument();
	await userEvent.keyboard('{Control>}{F6}{/Control}');
	expect(surface).toHaveAttribute('data-window-mode', 'fullscreen');
	await userEvent.keyboard('{Escape}');
	expect(surface).toHaveAttribute('data-window-mode', 'maximized');
	await expect(canvas.getByRole('navigation', { name: '窗口停靠栏' })).toBeInTheDocument();
	await userEvent.dblClick(titleBar as HTMLElement);
	expect(surface).toHaveAttribute('data-window-mode', 'normal');

	await userEvent.click(canvas.getByRole('button', { name: 'Audit logs' }));
	const audit = await canvas.findByRole('dialog', { name: 'Audit logs' });
	await expect(audit).toBeInTheDocument();
	const dock = canvas.getByRole('navigation', { name: '窗口停靠栏' });
	const auditDock = within(dock).getByRole('button', { name: 'Audit logs' });
	await userEvent.click(auditDock);
	expect(canvasElement.querySelector('[data-window-id="window-1"]')).toHaveAttribute('data-window-mode', 'minimized');
	await userEvent.click(within(dock).getByRole('button', { name: /Audit logs/ }));
	await userEvent.click(within(audit).getByRole('button', { name: '关闭' }));
	await expect(canvas.queryByRole('dialog', { name: 'Audit logs' })).not.toBeInTheDocument();

	await userEvent.click(within(dock).getByRole('button', { name: '窗口管理' }));
	await findPointerReadyMenuItem(documentBody, '窗口居中');
	await expect(documentBody.getByRole('menuitem', { name: '关闭当前窗口' })).toBeInTheDocument();
	await expect(documentBody.getByRole('menuitem', { name: '最小化所有窗口' })).toBeInTheDocument();
	await expect(documentBody.getByRole('menuitem', { name: '关闭所有窗口' })).toBeInTheDocument();
	await expect(documentBody.getByText('窗口管理 (3)')).toBeInTheDocument();
	await userEvent.click(await findPointerReadyMenuItem(documentBody, '窗口居中'));

	const accountMenu = within(dock).getByRole('button', { name: '账户菜单，有新通知' });
	await userEvent.click(accountMenu);
	const accountPopup = within(await documentBody.findByRole('menu'));
	await expect(accountPopup.getByText('林舟')).toBeInTheDocument();
	await expect(accountPopup.getByText('@linzhou')).toBeInTheDocument();
	await expect(accountPopup.getByRole('menuitem', { name: '个人资料' })).toBeInTheDocument();
	await expect(accountPopup.getByRole('menuitem', { name: '锁定' })).toBeInTheDocument();
	await expect(accountPopup.getByRole('menuitem', { name: '退出登录' })).toBeInTheDocument();
	await userEvent.click(accountPopup.getByRole('menuitem', { name: '偏好设置' }));
	await waitFor(() => expect(accountMenu).toHaveAttribute('aria-expanded', 'false'));
}

async function findPointerReadyMenuItem(documentBody: ReturnType<typeof within>, name: string) {
	const item = await documentBody.findByRole('menuitem', { name });
	await waitFor(() => expect(pointerBlockedAncestor(item)).toBeUndefined());
	return item;
}

function pointerBlockedAncestor(element: HTMLElement) {
	const view = element.ownerDocument.defaultView;
	for (let current: HTMLElement | null = element; current; current = current.parentElement) {
		if (view?.getComputedStyle(current).pointerEvents === 'none') return current;
		if (current === element.ownerDocument.body) break;
	}
	return undefined;
}

export async function playPersistentWindowManagerStory({ canvasElement }: { canvasElement: HTMLElement }) {
	const canvas = within(canvasElement);
	const runbook = canvas.getByRole('dialog', { name: 'Runbook' });
	await new Promise((resolve) => setTimeout(resolve, 120));
	await userEvent.click(within(runbook).getByRole('button', { name: '最大化' }));
	await userEvent.click(canvas.getByRole('button', { name: 'Rerender parent' }));
	await waitFor(() =>
		expect(canvasElement.querySelector('[data-window-id="runbook"]')).toHaveAttribute('data-window-mode', 'maximized'),
	);
	await new Promise((resolve) => setTimeout(resolve, 120));
	await userEvent.click(canvas.getByRole('button', { name: 'Reload runtime' }));
	await waitFor(() =>
		expect(canvasElement.querySelector('[data-window-id="runbook"]')).toHaveAttribute('data-window-mode', 'maximized'),
	);
}
