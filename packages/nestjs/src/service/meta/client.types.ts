import type { AbstractConstructor, Constructor } from '../../types';

export interface ServiceOptions {
  name: string;
  version?: string;
  summary?: string;
  description?: string;
  timeout?: number;
  metadata?: Record<string, any>;
  /**
   * Reference to Service Definition
   */
  as?: Constructor | AbstractConstructor;
}

export interface MethodOptions {
  name: string;
  summary?: string;
  description?: string;
  input?: any;
  output?: any;
  timeout?: number;
  metadata?: Record<string, any>;
  stream?: true;
}
