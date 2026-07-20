import { createReactContext } from '@wener/reaction';
import { type ReactNode, useCallback, useContext, useRef } from 'react';

export namespace MeasureSize {
	// in virtual list, trigger accent to measure size

	const Context = createReactContext<() => void>('MeasureSizeContext', () => void 0);

	export const Root = ({ value, children }: { value: () => void; children: ReactNode }) => {
		const ref = useRef(value);
		ref.current = value;
		return <Context value={useCallback(() => ref.current(), [ref])}>{children}</Context>;
	};

	export function useMeasureSize() {
		return useContext(Context);
	}
}
