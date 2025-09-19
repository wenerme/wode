import React, { act, useEffect, useState } from 'react';
import { expect, test } from 'vitest';
import { renderReactNodeToMarkdown } from './renderReactNodeToMarkdown';
import { renderReactNodeToText } from './renderReactNodeToText';

type Element = { type: any; props: Record<string, any>; children?: any };

test('renderText', async () => {
	expect(
		renderReactNodeToText(
			<>
				Hello World!
				<br />
				My name is <strong>Wener</strong>.
			</>,
		),
	).toBe('Hello World!\nMy name is Wener.');
	expect(
		renderReactNodeToMarkdown(
			<>
				Hello World!
				<br />
				My name is <strong>Wener</strong>.
			</>,
		),
	).toBe('Hello World!\nMy name is **Wener**.');

	// https://github.com/pmndrs/react-nil
	const { render, flushSync } = await import('./render');

	let ele = (
		<>
			<StateComp />
			Hello World!
			<br />
			My name is <strong>Wener</strong>.
		</>
	);

	{
		const { render } = await import('@testing-library/react');
		const { container, rerender } = render(ele);
		rerender(ele);
		console.log(container.innerHTML);
	}
});

const StateComp = () => {
	const [value, setValue] = useState(0);
	const [count, setCount] = useState(0);
	useEffect(() => {
		setValue((v) => v + 1);
	}, []);
	useEffect(() => {
		const hdr = setInterval(() => {
			setCount((c) => c + 1);
		}, 50);
		return () => {
			clearInterval(hdr);
		};
	}, []);
	return (
		<span>
			Value: {value} Count: {count}
		</span>
	);
};
