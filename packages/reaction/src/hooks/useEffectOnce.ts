import React, { EffectCallback } from 'react';

/**
 * useEffectOnce only run effect one
 * @param effect
 */
export function useEffectOnce(effect: EffectCallback) {
  React.useEffect(effect, []);
}
