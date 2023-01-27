import type { HTMLAttributes, ReactSVGElement } from 'react';
import React from 'react';
import { createContextComponent } from './ComponentContext';

export const SystemLogo = createContextComponent<HTMLAttributes<ReactSVGElement>>('Logo');
