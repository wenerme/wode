import { useEffect, useLayoutEffect } from 'react';

export let useIsoMorphicEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;
