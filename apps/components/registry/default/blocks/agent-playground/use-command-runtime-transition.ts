'use client';

import { type MutableRefObject, useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { AgentCommandRuntime } from '../agent-coding';
import { AgentRuntimeIdentityChangedCancelReason } from './playground-runtime';

export function useCommandRuntimeTransition(
	candidate: AgentCommandRuntime,
	identity: unknown,
	poisonedRef: MutableRefObject<boolean>,
) {
	const [commandRuntime, setCommandRuntime] = useState(candidate);
	const [poisoned, setPoisonedState] = useState(false);
	const [revision, setRevision] = useState(0);
	const activeRuntime = useRef(commandRuntime);
	const generation = useRef(0);
	const setPoisoned = useCallback(
		(value: boolean) => {
			poisonedRef.current = value;
			setPoisonedState(value);
		},
		[poisonedRef],
	);

	useLayoutEffect(() => {
		let current = true;
		const previousRuntime = activeRuntime.current;
		const runtimeReplaced = previousRuntime !== candidate;
		const transitionGeneration = ++generation.current;
		const previousState = previousRuntime.getState();
		if (previousState.running || previousState.mutationMayContinue || previousState.poisoned) setPoisoned(true);
		void previousRuntime.cancelCurrentAndWait(AgentRuntimeIdentityChangedCancelReason).then((settledState) => {
			if (!current || transitionGeneration !== generation.current) return;
			if (!runtimeReplaced) {
				setPoisoned(settledState.poisoned);
				return;
			}
			if (settledState.mutationMayContinue) {
				setPoisoned(true);
				return;
			}
			activeRuntime.current = candidate;
			setCommandRuntime(candidate);
			setPoisoned(candidate.getState().poisoned);
		});
		setRevision((value) => value + 1);
		return () => {
			current = false;
			poisonedRef.current = true;
			activeRuntime.current.cancelCurrent(AgentRuntimeIdentityChangedCancelReason);
		};
	}, [candidate, identity, poisonedRef, setPoisoned]);

	return { commandRuntime, generation, poisoned, revision, setPoisoned };
}
