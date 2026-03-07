import { type EffectCallback, useEffect } from 'react';

/**
 * useEffectOnce only run effect one
 * @param effect
 */
export function useEffectOnce(effect: EffectCallback) {
	useEffect(effect, []);
}
