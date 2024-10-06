import type { MethodOptionsInit, MethodSchema, ServiceOptions, ServiceSchema } from './index';

export type ExposeServiceOptions = ServiceOptions;
export type ExposeMethodOptions = MethodOptionsInit & {
  expose?: boolean;
};

export interface ServerServiceSchema extends ServiceSchema {
  name: string;
  options: ExposeServiceOptions;
  methods: MethodSchema[];
}
