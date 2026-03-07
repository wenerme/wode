import { type InitDef, runInit } from '@wener/common/meta';
import { useEffect, useState } from 'react';

export function useInit(init?: InitDef[]) {
	const [state, setState] = useState({ done: false });
	useEffect(() => {
		runInit(init).finally(() => {
			setState({ done: true });
		});
	}, []);
	return state;
}
