import React, { EffectCallback } from 'react';

export function useEffectOnce(effect: EffectCallback) {
  React.useEffect(effect, []);
}
