import { useEffect, useLayoutEffect } from 'react';

export const useIsoMorphicEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;
